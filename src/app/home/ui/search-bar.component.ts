import { Component, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [MatFormFieldModule, MatToolbarModule, ReactiveFormsModule, MatInputModule, MatIconModule],
  template: `
    <mat-toolbar>
      <mat-form-field appearance="outline">
        <input
          matInput
          placeholder="subreddit..."
          [formControl]="subredditFormControl()"
        >
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
    </mat-toolbar>
  `,
  styles: `
    mat-toolbar {
      height: 5rem;
    }

    mat-form-field {
      width: 100%;
      padding-top: 1rem;
    }
  `
})
export class SearchBarComponent {
  subredditFormControl = input.required<FormControl>();
}
