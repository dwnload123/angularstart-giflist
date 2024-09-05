import { Component, inject, input } from "@angular/core";
import { Gif } from "../../shared/interfaces";
import { GifPlayerComponent } from "./gif-player.component";
import { MatToolbar } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { WINDOW } from "../../shared/utils/injection-token";

@Component({
  standalone: true,
  selector: 'app-gif-list',
  template: `
    @for(gif of gifs(); track gif.permalink) {
      <div>
        <mat-toolbar color="primary">
            <span>{{ gif.title }}</span>
            <span class="toolbar-spacer"></span>
            <button
              mat-icon-button
              (click)="window.open('https://reddit.com/' + gif.permalink)"
            >
              <mat-icon>comment</mat-icon>
            </button>
        </mat-toolbar>
        <app-gif-player
          [src]="gif.src"
          [thumbnail]="gif.thumbnail"
        ></app-gif-player>
      </div>
    } @empty {
      <p>Can't find any gifs 🤷</p>
    }
  `,
  imports: [
    GifPlayerComponent,
    MatToolbar,
    MatIconModule,
  ],
  styles: [
    `
      div {
        margin: 1rem;
        filter: drop-shadow(0px 0px 6px #0e0c1ba8);
      }

      mat-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        white-space: break-spaces;
      }

      p {
        font-size: 2em;
        width: 100%;
        text-align: center;
        margin-top: 4rem;
      }
    `
  ]
})
export class GifListComponent {
  gifs = input.required<Gif[]>();
  window = inject(WINDOW);
}
