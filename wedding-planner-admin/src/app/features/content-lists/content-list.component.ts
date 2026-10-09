import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MarketingListItem, MarketingService } from '../../core/services/marketing.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { LIST_CONFIGS, ListConfig, ListField } from './list-configs';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One screen for all four editable lists.
 *
 * The shape of each list is declared in list-configs.ts, so this component
 * only has to know about field types: plain text, a textarea, a URL-safe
 * slug, or a "lines" field, where each line of the textarea becomes one item
 * of a list. That last one is the reason this is a hand-rolled form rather
 * than four typed ones - it is far kinder to edit a checklist as lines of
 * text than as anything else.
 */
@Component({
  selector: 'app-content-list',
  imports: [ReactiveFormsModule],
  templateUrl: './content-list.component.html',
  styleUrl: './content-list.component.scss',
})
export class ContentListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly marketingService = inject(MarketingService);
  private readonly notifications = inject(NotificationService);
  private readonly titleService = inject(Title);

  readonly config = signal<ListConfig>(LIST_CONFIGS['faq']);
  readonly items = signal<MarketingListItem[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly savingNew = signal(false);

  /** Which row is open for editing; null means none. */
  readonly editingId = signal<string | null>(null);
  readonly addingNew = signal(false);

  editForm: FormGroup = this.fb.group({});
  newForm: FormGroup = this.fb.group({});

  readonly publishedCount = computed(() => this.items().filter((item) => item.published).length);

  ngOnInit(): void {
    const key = this.route.snapshot.data['listKey'] as string;
    const config = LIST_CONFIGS[key];
    this.config.set(config);
    this.titleService.setTitle(`${config.title} | Wedding Planner Admin`);
    this.newForm = this.buildForm(config.fields);
    this.load();
  }

  /** The row's headline when collapsed. */
  summary(item: MarketingListItem): string {
    const value = item[this.config().titleField];
    return typeof value === 'string' && value.trim() ? value : '(untitled)';
  }

  startEdit(item: MarketingListItem): void {
    this.editingId.set(item.id);
    this.addingNew.set(false);
    this.editForm = this.buildForm(this.config().fields, item);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  startAdd(): void {
    this.editingId.set(null);
    this.addingNew.set(true);
    this.newForm = this.buildForm(this.config().fields);
  }

  cancelAdd(): void {
    this.addingNew.set(false);
  }

  saveEdit(item: MarketingListItem): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.busyId.set(item.id);
    this.marketingService
      .update(this.config().resource, item.id, this.serialize(this.editForm))
      .subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((row) => (row.id === item.id ? updated : row)));
          this.busyId.set(null);
          this.editingId.set(null);
          this.notifications.success('Saved.');
        },
        error: (error: HttpErrorResponse) => {
          this.busyId.set(null);
          this.notifications.error(extractErrorMessage(error, 'Could not save that change.'));
        },
      });
  }

  saveNew(): void {
    if (this.newForm.invalid) {
      this.newForm.markAllAsTouched();
      return;
    }

    this.savingNew.set(true);
    this.marketingService.create(this.config().resource, this.serialize(this.newForm)).subscribe({
      next: (created) => {
        this.items.update((list) => [...list, created]);
        this.savingNew.set(false);
        this.addingNew.set(false);
        this.notifications.success(`${this.capitalised(this.config().itemNoun)} added.`);
      },
      error: (error: HttpErrorResponse) => {
        this.savingNew.set(false);
        this.notifications.error(extractErrorMessage(error, 'Could not add that item.'));
      },
    });
  }

  togglePublished(item: MarketingListItem): void {
    this.busyId.set(item.id);
    this.marketingService
      .update(this.config().resource, item.id, { published: !item.published })
      .subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((row) => (row.id === item.id ? updated : row)));
          this.busyId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.busyId.set(null);
          this.notifications.error(extractErrorMessage(error, 'Could not change that item.'));
        },
      });
  }

  remove(item: MarketingListItem): void {
    this.busyId.set(item.id);
    this.marketingService.remove(this.config().resource, item.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((row) => row.id !== item.id));
        this.busyId.set(null);
        this.notifications.info('Deleted.');
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.notifications.error(extractErrorMessage(error, 'Could not delete that item.'));
      },
    });
  }

  /** Swaps a row with its neighbour and saves the whole order. */
  move(item: MarketingListItem, direction: -1 | 1): void {
    const current = this.items();
    const index = current.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;

    const reordered = [...current];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.items.set(reordered);

    this.marketingService.reorder(
      this.config().resource,
      reordered.map((row) => row.id),
    ).subscribe({
      error: (error: HttpErrorResponse) => {
        // Put it back: the displayed order must match what is stored.
        this.items.set(current);
        this.notifications.error(extractErrorMessage(error, 'Could not change the order.'));
      },
    });
  }

  fieldControlInvalid(form: FormGroup, field: ListField): boolean {
    const control = form.get(field.key);
    return Boolean(control && control.invalid && control.touched);
  }

  fieldError(form: FormGroup, field: ListField): string {
    const control = form.get(field.key);
    if (control?.hasError('pattern')) {
      return 'Use lowercase words separated by hyphens.';
    }
    return `${field.label} is required.`;
  }

  private buildForm(fields: ListField[], item?: MarketingListItem): FormGroup {
    const group: Record<string, unknown[]> = {};

    for (const field of fields) {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.type === 'slug') validators.push(Validators.pattern(SLUG_PATTERN));

      group[field.key] = [this.initialValue(field, item), validators];
    }

    return this.fb.group(group);
  }

  /** A "lines" field is edited as text, one list item per line. */
  private initialValue(field: ListField, item?: MarketingListItem): string {
    if (!item) return '';
    const value = item[field.key];

    if (field.type === 'lines') {
      return Array.isArray(value) ? (value as string[]).join('\n') : '';
    }
    return typeof value === 'string' ? value : '';
  }

  private serialize(form: FormGroup): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    for (const field of this.config().fields) {
      const raw = String(form.get(field.key)?.value ?? '');

      if (field.type === 'lines') {
        payload[field.key] = raw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      } else {
        payload[field.key] = raw.trim();
      }
    }

    return payload;
  }

  private capitalised(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  private load(): void {
    this.loading.set(true);
    this.marketingService.list(this.config().resource).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
