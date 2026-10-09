import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CalendarDay, DateKey } from '../../core/models/availability.model';
import {
  WEEKDAY_HEADERS,
  addDays,
  dayOfMonth,
  formatFullDate,
  formatMonth,
  mondayFirstWeekday,
  monthOf,
  toWeeks,
} from '../../core/utils/calendar.util';

/** A day plus everything the grid needs to draw and describe one cell. */
interface GridCell {
  day: CalendarDay;
  number: number;
  /** Padding day from the previous or next month. */
  outside: boolean;
  selectable: boolean;
  isToday: boolean;
  /** Full description for screen readers, since the numeral alone says nothing. */
  label: string;
  /** One mark per slot: filled when free, hollow when taken. */
  marks: boolean[];
  /** Nothing left because other couples hold the times. */
  fullyBooked: boolean;
  /** Nothing left for a reason other than bookings: passed, or too soon. */
  noTimesLeft: boolean;
}

/**
 * The month grid. Follows the APG date-picker pattern: a real table with
 * role="grid", one tab stop that roves with the arrow keys, and every cell
 * described in full for screen readers. Availability is shown in the cell
 * itself - a mark per free slot - so nobody has to click a date to discover
 * whether anything is left on it.
 */
@Component({
  selector: 'app-month-calendar',
  imports: [],
  templateUrl: './month-calendar.component.html',
  styleUrl: './month-calendar.component.scss',
})
export class MonthCalendarComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Month being displayed, as 'YYYY-MM'. */
  readonly month = input.required<string>();
  /** A padded run of days: Monday before the 1st through Sunday after the last. */
  readonly days = input.required<CalendarDay[]>();
  readonly selected = input<DateKey | null>(null);
  readonly today = input<DateKey | null>(null);
  readonly canGoBack = input(true);
  readonly canGoForward = input(true);
  readonly loading = input(false);

  readonly dateSelected = output<DateKey>();
  /** Asks the parent for another month, and which date to focus once it loads. */
  readonly monthStepped = output<{ delta: number; focusDate: DateKey }>();

  readonly weekdays = WEEKDAY_HEADERS;

  /** The cell holding the single tab stop. */
  private readonly focusedDate = signal<DateKey | null>(null);
  /** Set when a month step is waiting for new data before focus can move. */
  private pendingFocus: DateKey | null = null;

  readonly monthLabel = computed(() => formatMonth(this.month()));

  readonly weeks = computed<GridCell[][]>(() => {
    const month = this.month();
    const today = this.today();
    const cells = this.days().map<GridCell>((day) => {
      const outside = monthOf(day.date) !== month;
      const nothingLeft = day.open && day.totalCount > 0 && day.freeCount === 0;
      const anyReserved = day.slots.some((slot) => slot.state === 'RESERVED');

      return {
        day,
        number: dayOfMonth(day.date),
        outside,
        // Fully booked days stay selectable: the slot list then explains which
        // times went and offers the next opening.
        selectable: !outside && day.open && day.totalCount > 0,
        isToday: day.date === today,
        label: this.describe(day, outside, month),
        marks: day.slots.map((slot) => slot.state === 'FREE'),
        fullyBooked: nothingLeft && anyReserved,
        noTimesLeft: nothingLeft && !anyReserved,
      };
    });

    return toWeeks(cells.map((cell) => cell.day)).map((week, weekIndex) =>
      week.map((_, dayIndex) => cells[weekIndex * 7 + dayIndex]),
    );
  });

  /** The cell that carries tabindex="0" - selected, else today, else the 1st. */
  readonly tabStop = computed<DateKey | null>(() => {
    const focused = this.focusedDate();
    const cells = this.weeks().flat();
    if (focused && cells.some((cell) => cell.day.date === focused)) {
      return focused;
    }

    const selected = this.selected();
    if (selected && cells.some((cell) => cell.day.date === selected)) {
      return selected;
    }

    const firstSelectable = cells.find((cell) => cell.selectable);
    return firstSelectable?.day.date ?? cells.find((cell) => !cell.outside)?.day.date ?? null;
  });

  constructor() {
    // A month step cannot move focus until the new month's cells exist.
    effect(() => {
      const dates = new Set(this.days().map((day) => day.date));
      const pending = this.pendingFocus;
      if (!pending || !dates.has(pending) || !this.isBrowser) return;

      this.pendingFocus = null;
      this.focusedDate.set(pending);
      setTimeout(() => this.moveFocusTo(pending));
    });
  }

  select(cell: GridCell): void {
    if (!cell.selectable) return;
    this.focusedDate.set(cell.day.date);
    this.dateSelected.emit(cell.day.date);
  }

  stepMonth(delta: number): void {
    const anchor = this.tabStop();
    this.monthStepped.emit({ delta, focusDate: anchor ?? '' });
  }

  /** Arrow/Home/End/PageUp/PageDown handling, per the APG grid pattern. */
  onKeydown(event: KeyboardEvent): void {
    const current = this.tabStop();
    if (!current) return;

    const step = (days: number) => this.requestFocus(addDays(current, days));

    switch (event.key) {
      case 'ArrowLeft':
        step(-1);
        break;
      case 'ArrowRight':
        step(1);
        break;
      case 'ArrowUp':
        step(-7);
        break;
      case 'ArrowDown':
        step(7);
        break;
      case 'Home':
        // Monday of the current week.
        step(-mondayFirstWeekday(current));
        break;
      case 'End':
        // Sunday of the current week.
        step(6 - mondayFirstWeekday(current));
        break;
      case 'PageUp':
        this.stepByMonths(current, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        this.stepByMonths(current, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ': {
        const cell = this.weeks()
          .flat()
          .find((candidate) => candidate.day.date === current);
        if (cell) this.select(cell);
        break;
      }
      default:
        return;
    }

    // Every handled key would otherwise scroll the page.
    event.preventDefault();
  }

  private stepByMonths(from: DateKey, months: number): void {
    const date = new Date(`${from}T00:00:00Z`);
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const lastDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();
    // Keep the day number where the target month is long enough for it.
    target.setUTCDate(Math.min(date.getUTCDate(), lastDay));

    this.requestFocus(target.toISOString().slice(0, 10), months);
  }

  /** Moves the tab stop, asking the parent for another month if needed. */
  private requestFocus(date: DateKey, monthDelta?: number): void {
    const loaded = this.days().some((day) => day.date === date);
    const inMonth = monthOf(date) === this.month();

    if (loaded && inMonth) {
      this.focusedDate.set(date);
      this.moveFocusTo(date);
      return;
    }

    const delta = monthDelta ?? (date < this.month() ? -1 : 1);
    if ((delta < 0 && !this.canGoBack()) || (delta > 0 && !this.canGoForward())) return;

    this.pendingFocus = date;
    this.monthStepped.emit({ delta, focusDate: date });
  }

  private moveFocusTo(date: DateKey): void {
    if (!this.isBrowser) return;
    const element = (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>(
      `[data-date="${date}"]`,
    );
    element?.focus();
  }

  private describe(day: CalendarDay, outside: boolean, month: string): string {
    const date = formatFullDate(day.date);
    if (outside) return `${date}, outside ${formatMonth(month)}`;

    if (!day.open) {
      switch (day.closedReason) {
        case 'PAST':
          return `${date}, in the past`;
        case 'BEYOND_HORIZON':
          return `${date}, not open for booking yet`;
        case 'BLOCKED':
          return day.closedNote
            ? `${date}, unavailable: ${day.closedNote}`
            : `${date}, unavailable`;
        default:
          return `${date}, closed`;
      }
    }

    if (day.freeCount === 0) {
      return day.slots.some((slot) => slot.state === 'RESERVED')
        ? `${date}, fully booked`
        : `${date}, no times left`;
    }
    return `${date}, ${day.freeCount} of ${day.totalCount} times available`;
  }
}
