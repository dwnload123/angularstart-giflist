import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Gif, RedditPost, RedditResponse } from "../interfaces";
import { catchError, concatMap, debounceTime, distinctUntilChanged, EMPTY, expand, map, of, startWith, Subject, switchMap, tap } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { FormControl } from "@angular/forms";
import { Statement } from "@angular/compiler";

interface GifState {
  gifs: Gif[];
  error: string | null;
  loading: boolean;
  lastKnownGif: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RedditService {
  private http = inject(HttpClient);
  subredditFormControl = new FormControl();
  // state
  private state = signal<GifState>({
    gifs: [],
    error: null,
    loading: false,
    lastKnownGif: null,
  });

  // selectors
  gifs = computed(() => this.state().gifs);
  error = computed(() => this.state().error);
  loading = computed(() => this.state().loading);
  lastKnowGif = computed(() => this.state().lastKnownGif);

  // sources
  pagination$ = new Subject<string | null>();
  private subredditChanged$ = this.subredditFormControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith('gifs'),
    map((subreddit) => (subreddit.length ? subreddit : 'gifs'))
  );
  private error$ = new Subject<string | null>();
  gifsLoaded$ = this.subredditChanged$.pipe(
    switchMap((subreddit) =>
      this.pagination$.pipe(
        startWith(null),
        concatMap((lastKnownGif) =>
          this.fetchFromReddit(subreddit, lastKnownGif, 20).pipe(
            expand((response, index) => {
              const { gifs, gifsRequired, lastKnownGif } = response;
              const remainingGifsToFetch = gifsRequired - gifs.length;
              const maxAttempts = 15;

              console.log('shouldKeepTrying')

              const shouldKeepTrying =
                remainingGifsToFetch > 0 &&
                index < maxAttempts &&
                lastKnownGif !== null;

              return shouldKeepTrying
                ? this.fetchFromReddit(
                  subreddit,
                  lastKnownGif,
                  remainingGifsToFetch,
                )
                : EMPTY
            })
          )
        )
      )
    )
  )

  constructor() {
    //reducers
    this.gifsLoaded$.pipe(takeUntilDestroyed()).subscribe((response) =>
      this.state.update((state) => ({
        ...state,
        gifs: [ ...state.gifs, ...response.gifs],
        loading: false,
        lastKnownGif: response.lastKnownGif,
      }))
    );

    this.subredditChanged$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.state.update((state) => ({
        ...state,
        gifs: [],
        loading: true,
        lastKnownGif: null,
      }));
    });

    this.error$.pipe(takeUntilDestroyed()).subscribe((error) => {
      this.state.update((state) => ({
        ...state,
        error,
      }))
    })

    effect(() => {
      console.log('gifs', this.gifs())
    })
  }


  private fetchFromReddit(
    subreddit: string,
    after: string | null,
    gifsRequired: number,
  ) {
    return this.http
      .get<RedditResponse>(
        `https://www.reddit.com/r/${subreddit}/hot/.json?limit=${gifsRequired}` +
        (after ? `&after=${after}` : '')
      )
      .pipe(
        catchError((err) => {
          this.handleError(err);
          return EMPTY;
        }),
        map((response) => {
          const posts = response.data.children;
          const lastKnownGif = posts.length
            ? posts[posts.length - 1].data.name
            : null;
          console.log('=>', this.convertRedditPostsToGifs(response.data.children))
          return {
            gifs: this.convertRedditPostsToGifs(response.data.children),
            gifsRequired,
            lastKnownGif,
          }

        })
      );
  }

  private convertRedditPostsToGifs(posts: RedditPost[]) {
    const defaultThumbnails = ['default', 'none', 'nsfw'];

    return posts
      .map((post) => {
        const thumbnail = post.data.thumbnail;
        const modifiedThumbnail = defaultThumbnails.includes(thumbnail)
          ? `/assets/${thumbnail}.png`
          : thumbnail;

        const validThumbnail =
          modifiedThumbnail.endsWith('.jpg') ||
          modifiedThumbnail.endsWith('.png');

        return {
          src: this.getBestSrcForGif(post),
          author: post.data.author,
          name: post.data.name,
          permalink: post.data.permalink,
          title: post.data.title,
          thumbnail: validThumbnail ? modifiedThumbnail : `/assets/default.png`,
          comments: post.data.num_comments,
        };
      })
      .filter((post): post is Gif => post.src !== null)
  }

  private getBestSrcForGif(post: RedditPost) {
    // If the source is in .mp4 format, leave unchanged
    if(post.data.url.indexOf('.mp4') > -1) {
      return post.data.url;
    }

    // If the source is in .gifv or .webm formats, convert to .mp4 and return
    if(post.data.url.indexOf('.gifv') > -1) {
      return post.data.url.replace('.gifv', '.mp4')
    }

    if(post.data.url.indexOf('.webm') > -1) {
      return post.data.url.replace('.webm', '.mp4');
    }

    // If the URL is not .gifv or .webm, check if media or secure media is available
    if(post.data.secure_media?.reddit_video) {
      return post.data.secure_media.reddit_video.fallback_url;
    }

    if(post.data.media?.reddit_video) {
      return post.data.media.reddit_video.fallback_url;
    }

     // If media objects are not available, check if a preview is available
    if(post.data.preview?.reddit_video_preview) {
      return post.data.preview.reddit_video_preview.fallback_url;
    }

    return null
  }

  private handleError(err: HttpErrorResponse) {
    // Handle specifics error cases
    if(err.status === 404 && err.url) {
      this.error$.next(`Failed to load gifs /r/${err.url.split('/')[4]}`);
      return;
    }
    // generic error if no cases matches
    this.error$.next(err.statusText);
  }
}
