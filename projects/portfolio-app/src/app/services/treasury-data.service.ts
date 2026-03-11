import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment'

interface FredObservation {
  date: string;
  value: string;
}

interface FredSeriesResponse {
  observations: FredObservation[];
}

@Injectable({
  providedIn: 'root'
})
export class TreasuryData {

  constructor(private http: HttpClient) { }


  public postData(data: any) {
    const url = environment.treasuryProxyUrl;

    return this.http.post(url, data, { responseType: 'json' }).pipe(
      retry(3), // retry a failed request up to 3 times
      catchError(this.handleError)
    );
  };

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    console.log('an error was thrown');

    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  public getRecessionData(): Observable<{ date: Date; value: number }[]> {
    const fredProxy = environment.reverseProxyUrl;

    return this.http.post<FredSeriesResponse>(fredProxy, {
      url: 'https://api.stlouisfed.org/fred/series/observations',
      series_id: 'USRECD',
      units: 'lin',
      observation_start: '1990-01-01',
      file_type: 'json'
    }, { responseType: 'json' }).pipe(
      retry(3),
      map(resp =>
        (resp.observations || [])
          .filter(o => o.value !== '.' && o.value !== '')
          .map(o => ({
            date: new Date(o.date),
            value: Number(o.value)
          }))
      ),
      catchError(this.handleError)
    );
  }
}
