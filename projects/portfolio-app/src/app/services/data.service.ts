import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, retry, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  public getData(url: string) {
    return this.http.get(url, { responseType: 'json' }).pipe(
      retry(3), // retry a failed request up to 3 times
      catchError(this.handleError)
    );
  }

  public getXML(url: string) {
    return this.http.get(url, { responseType: 'text' }).pipe(
      retry(3), // retry a failed request up to 3 times
      catchError(this.handleError)
    )
  }

  public postData(url: string, data: any) {
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
}

