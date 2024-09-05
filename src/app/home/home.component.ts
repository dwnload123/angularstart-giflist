import { Component, effect, inject } from "@angular/core";
import { GifListComponent } from "./ui/gif-list.component";
import { RedditService } from "../shared/data-access/reddit.service";
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { SearchBarComponent } from "./ui/search-bar.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";


@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <app-search-bar
      [subredditFormControl]="redditService.subredditFormControl"
    />

    @if (redditService.loading()) {
      <mat-progress-spinner mode="indeterminate" diamater="50"></mat-progress-spinner>
    } @else {
      <app-gif-list
        [gifs]="redditService.gifs()"
        class="grid-container"
        infiniteScroll
        (scrolled)="redditService.pagination$.next(redditService.lastKnowGif())"
      />
    }
  `,
  imports: [
    GifListComponent,
    InfiniteScrollDirective,
    SearchBarComponent,
    MatProgressSpinnerModule,
  ],
  styles: `
    mat-progress-spinner {
      margin: 2rem;
      height: auto;
    }

  `
})
export default class HomeComponent {
  redditService = inject(RedditService);
}
