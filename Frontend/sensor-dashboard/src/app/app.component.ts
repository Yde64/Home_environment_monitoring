import { Component, OnInit } from '@angular/core';
import { SensorDataComponent } from './components/sensor-data/sensor-data.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SensorDataComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
  }
}
