import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { SensorService } from '../../services/sensor.service';
import zoomPlugin from 'chartjs-plugin-zoom';
import Chart from 'chart.js/auto';
Chart.register(zoomPlugin);


@Component({
  selector: 'app-sensor-data',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './sensor-data.component.html',
  styleUrls: ['./sensor-data.component.css'],
})
export class SensorDataComponent implements OnInit, AfterViewInit {
  sensorData: any[] = [];
  co2ChartData: any;
  particleChartData: any;
  tempChartData: any;
  humidityChartData: any;

  co2ChartOptions: any;
  particleChartOptions: any;
  tempChartOptions: any;
  humidityChartOptions: any;

  showTable: boolean = false;
  timeRangeInHours: number = 1; // Default to 1 hour

  co2ChartClass = 'within-threshold';
  particleChartClass = 'within-threshold';
  tempChartClass = 'within-threshold';
  humidityChartClass = 'within-threshold';


  readonly thresholds = {
    co2: { max: 1000 },
    particle: { max: 22 },
    temperature: { min: 15, max: 26 },
    humidity: { min: 25, max: 60 },
  };
  

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    this.fetchSensorData();
    this.triggerChartResize();
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', () => this.triggerChartResize());
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      const resizeObserver = new ResizeObserver(() => {
        this.triggerChartResize(); // Trigger resize when the container size changes
        console.log('Chart container dimensions:', chartContainer.clientWidth, chartContainer.clientHeight);
      });
      resizeObserver.observe(chartContainer);
    }
  }
  

  fetchSensorData(): void {
    this.sensorService.getSensorData(this.timeRangeInHours * 3600).subscribe(
      (data) => {
        this.sensorData = data
          .slice(-200) // Limit to the last 200 data points
          .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
        this.updateChartsForTimeRange();
      },
      (error) => {
        console.error('Error fetching sensor data:', error);
      }
    );
  }

  updateChartsForTimeRange(): void {
    const now = Date.now() / 1000; // Current time in seconds
    const rangeStart = now - this.timeRangeInHours * 3600; // Calculate start time in seconds

    // Filter the sensorData to include only data within the selected time range
    const filteredData = this.sensorData.filter(
      (data) => data.timestamp >= rangeStart
    );

    // Update the charts with the filtered data
    this.updateChartData(filteredData);
  }

  getMaxTicksLimit(): number {
    if (this.timeRangeInHours <= 1) {
      return 12; // For 1-hour range, show 6 ticks (e.g., every 10 minutes)
    } else if (this.timeRangeInHours <= 5) {
      return 12; // For up to 5 hours, show 10 ticks
    } else if (this.timeRangeInHours <= 24) {
      return 24; // For 24 hours, show hourly ticks
    } else {
      return 42; // For larger ranges, show 1 tick per day or week
    }
  }
  

  updateChartData(filteredData: any[]): void {
    const timestamps = filteredData.map((data) =>
      this.convertEpochToTime(data.timestamp)
    );

    const lastCO2 = filteredData[filteredData.length - 1]?.payload?.co2 || 0;
    const lastParticle24 = filteredData[filteredData.length - 1]?.payload?.particle24 || 0;
    const lastTemp = filteredData[filteredData.length - 1]?.payload?.SHT_Temp || 0;
    const lastHumidity = filteredData[filteredData.length - 1]?.payload?.SHT_RH || 0;

    // Determine classes for chart containers
    this.co2ChartClass = lastCO2 > this.thresholds.co2.max ? 'out-of-threshold' : 'within-threshold';
    this.particleChartClass = lastParticle24 > this.thresholds.particle.max ? 'out-of-threshold' : 'within-threshold';
    this.tempChartClass = (lastTemp < this.thresholds.temperature.min || lastTemp > this.thresholds.temperature.max)
      ? 'out-of-threshold' : 'within-threshold';
    this.humidityChartClass = (lastHumidity < this.thresholds.humidity.min || lastHumidity > this.thresholds.humidity.max)
      ? 'out-of-threshold' : 'within-threshold';

      
    // CO2 Chart Data
    this.co2ChartData = {
      labels: timestamps,
      datasets: [
        {
          label: 'CO2 Levels',
          data: filteredData.map((data) => data.payload.co2),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          type: 'line',
        },
      ],
    };
    this.co2ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with the mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with touch gestures
            },
            mode: 'x', // Allow zooming only along the x-axis (change to 'y' or 'xy' if needed)
          },
          pan: {
            enabled: true, // Enable panning
            mode: 'x', // Allow panning only along the x-axis (change to 'y' or 'xy' if needed)
          },
        },
      },
      scales: {
        x: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Time',
          },
          ticks: {
            autoSkip: true, // Automatically skip ticks to avoid crowding
            maxTicksLimit: this.getMaxTicksLimit(), // Limit the number of ticks displayed
          },
          offset: false, // Align ticks directly with gridlines
        },
        y: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'CO2 (ppm)', // Set the unit here
          },
        },
      },
    };

    // Particle Chart Data
    this.particleChartData = {
      labels: timestamps,
      datasets: [
        {
          label: 'Particle 24',
          data: filteredData.map((data) => data.payload.particle24),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          type: 'line',
        },
        {
          label: 'Particle 10',
          data: filteredData.map((data) => data.payload.particle10),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          type: 'line',
        },
      ],
    };
    this.particleChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with the mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with touch gestures
            },
            mode: 'x', // Allow zooming only along the x-axis (change to 'y' or 'xy' if needed)
          },
          pan: {
            enabled: true, // Enable panning
            mode: 'x', // Allow panning only along the x-axis (change to 'y' or 'xy' if needed)
          },
        },
      },
      scales: {
        x: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Time',
          },
          ticks: {
            autoSkip: true, // Automatically skip ticks to avoid crowding
            maxTicksLimit: this.getMaxTicksLimit(), // Limit the number of ticks displayed
          },
          offset: false, // Align ticks directly with gridlines
        },
        y: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Particles (µg/m³)', // Set the unit here
          },
        },
      },
    };

    // Temperature Chart Data
    this.tempChartData = {
      labels: timestamps,
      datasets: [
        {
          label: 'Temperature',
          data: filteredData.map((data) => data.payload.SHT_Temp),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: false,
          type: 'line',
        },
      ],
    };
    this.tempChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with the mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with touch gestures
            },
            mode: 'x', // Allow zooming only along the x-axis (change to 'y' or 'xy' if needed)
          },
          pan: {
            enabled: true, // Enable panning
            mode: 'x', // Allow panning only along the x-axis (change to 'y' or 'xy' if needed)
          },
        },
      },
      scales: {
        x: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Time',
          },
          ticks: {
            autoSkip: true, // Automatically skip ticks to avoid crowding
            maxTicksLimit: this.getMaxTicksLimit(), // Limit the number of ticks displayed
          },
          offset: false, // Align ticks directly with gridlines
        },
        y: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Temperature (°C)', // Set the unit here
          },
        },
      },
    };

    // Humidity Chart Data
    this.humidityChartData = {
      labels: timestamps,
      datasets: [
        {
          label: 'Humidity',
          data: filteredData.map((data) => data.payload.SHT_RH),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: false,
          type: 'line',
        },
      ],
    };
    this.humidityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with the mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with touch gestures
            },
            mode: 'x', // Allow zooming only along the x-axis (change to 'y' or 'xy' if needed)
          },
          pan: {
            enabled: true, // Enable panning
            mode: 'x', // Allow panning only along the x-axis (change to 'y' or 'xy' if needed)
          },
        },
      },
      scales: {
        x: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Time',
          },
          ticks: {
            autoSkip: true, // Automatically skip ticks to avoid crowding
            maxTicksLimit: this.getMaxTicksLimit(), // Limit the number of ticks displayed
          },
        },
        y: {
          title: {
            beginAtZero: true,
            display: true,
            text: 'Humidity (%RH)', // Set the unit here
          },
        },
      },
    };

    // Trigger resize after updating data
    this.triggerChartResize();
  }

  triggerChartResize(): void {
    // Trigger the resize method for each chart
    const chartElements = document.querySelectorAll('canvas');
    chartElements.forEach((chart) => {
      const chartInstance = (chart as any)._chartInstance;
      if (chartInstance) {
        chartInstance.resize();
        chartInstance.update(); // Force a re-render of the chart
      }
    });
  }

  onTimeRangeChange(event: any): void {
    this.timeRangeInHours = +event.target.value;
    this.fetchSensorData();
  }

  convertEpochToTime(epoch: number): string {
    const date = new Date(epoch * 1000); // Convert seconds to milliseconds
    if (this.timeRangeInHours > 24) {
      // If the range is greater than 1 day, include the date
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      // For smaller ranges, show only the time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  
  toggleTableVisibility(): void {
    this.showTable = !this.showTable; // Toggle the boolean
  }
  
  appendNewData(newData: any): void {
    this.sensorData.push(newData);
    this.sensorData.sort((a, b) => a.timestamp - b.timestamp); // Sort after adding new data
    if (this.sensorData.length > 200) {
      this.sensorData.shift(); // Remove the oldest data point if over the limit
    }
    this.updateChartsForTimeRange();
  }
}
