import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackToTopComponent } from './layout/back-to-top/back-to-top.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BackToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
