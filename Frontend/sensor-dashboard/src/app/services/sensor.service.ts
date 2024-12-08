import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes it available app-wide
})
export class SensorService {
  private apiUrl = 'http://localhost:3000/data'; // Backend API endpoint

  constructor(private http: HttpClient) {}

  getSensorData(timeRange: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/data?timeRange=${timeRange}`);
  }
}


