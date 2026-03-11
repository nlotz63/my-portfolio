import { Component, OnInit, signal, ElementRef, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/annotations';
import 'highcharts/modules/series-label';
import 'highcharts/modules/accessibility';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { toObservable } from '@angular/core/rxjs-interop';
import { TreasuryData } from '../services/treasury-data.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { interval } from 'rxjs';
import { BusPubLibModule } from 'bus-pub-lib';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-interactive16',
  imports: [CommonModule, BusPubLibModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDatepickerModule, MatRadioModule, MatIconModule, MatTooltipModule],
  templateUrl: './interactive16.component.html',
  styleUrl: './interactive16.component.scss',
  providers: [provideNativeDateAdapter()]
})

export class Interactive16Component implements OnInit {

  chart!: Highcharts.Chart;
  title: WritableSignal<string> = signal('Yield Curves on U.S. Treasury Issues');
  interval = interval(250);
  subscription: any;
  recessionData: { date: Date; value: number }[] = [];
  option: WritableSignal<number> = signal(0);

  graph = {
    title: 'Selected Yield Curves',
    caption: `Source: U.S. Department of the Treasury. <b>Note:</b> You can use your mouse to zoom in on a specific area of the graph. Click and drag your mouse over the area you want to zoom in on.`,
    xTitle: 'Time to maturity (years)',
    yTitle: 'Yield to maturity',
    xMin: undefined,
    xMax: undefined,
    xInterval: undefined,
    yMin: 0,
    yMax: 10,
    yInterval: 1
  }

  // button signals
  playButtonDisabled: WritableSignal<boolean> = signal(false);
  pauseButtonDisabled: WritableSignal<boolean> = signal(false);
  resetButtonDisabled: WritableSignal<boolean> = signal(false);
  // Datepicker
  selectedDate: WritableSignal<Date> = signal(new Date('2024-10-11T00:00:00'));
  selectedDate$ = toObservable(this.selectedDate);
  yieldCurves: any[] = [{ date: '1990-01-01T00:00:00', points: [{ x: 0, y: 0 }] }]; // array to hold all yield curves for animation
  startDatePointer: WritableSignal<number> = signal(0);
  startDatePointer$ = toObservable(this.startDatePointer);
  minDatePointer: WritableSignal<number> = signal(0);
  maxDatePointer: WritableSignal<number> = signal(0);


  constructor(private el: ElementRef, private liveAnnouncer: LiveAnnouncer, private treasuryService: TreasuryData) { }

  ngOnInit(): void {
    Highcharts.setOptions({
      colors: ['#0C4DA2', '#600037', '#BB6530', '#1e8bc3', '#d35400', '#708090', '#708080', '#c0392b', '#d91e18', '#4b6a88'],
      lang: {
        thousandsSep: ','
      }
    });
    this.treasuryService.getRecessionData().subscribe((data: { date: Date; value: number }[]) => this.recessionData = data);

    this._setupChart();
    this.selectedDate$.subscribe((value: Date) => {
      this._addDataSeries(value);
    });
    setTimeout(() => {
      this.selectedDate.set(new Date('2020-06-05T00:00:00'));
    }, 100);
    setTimeout(() => {
      this.selectedDate.set(new Date('2022-06-23T00:00:00'));
    }, 200);



    // request all treasury data and store in yieldCurves. Will be used for yield curve animation
    this.treasuryService.postData({}).subscribe((data: any) => {
      if (this.yieldCurves.length > 0) this.yieldCurves = [];
      data.data.forEach((el: any) => {
        this.yieldCurves.push({
          date: el.date, points:
            [
              { name: '1-month', x: 1 / 12, y: el.rates['1month'] },
              { name: '1.5-month', x: 1 / 8, y: el.rates['1_5month'] },
              { name: '3-month', x: 1 / 4, y: el.rates['3month'] },
              { name: '4-month', x: 1 / 3, y: el.rates['4month'] },
              { name: '6-month', x: 1 / 2, y: el.rates['6month'] },
              { name: '1-year', x: 1, y: el.rates['1year'] },
              { name: '2-year', x: 2, y: el.rates['2year'] },
              { name: '3-year', x: 3, y: el.rates['3year'] },
              { name: '5-year', x: 5, y: el.rates['5year'] },
              { name: '7-year', x: 7, y: el.rates['7year'] },
              { name: '10-year', x: 10, y: el.rates['10year'] },
              { name: '20-year', x: 20, y: el.rates['20year'] },
              { name: '30-year', x: 30, y: el.rates['30year'] }
            ]
        });
      });
      this.maxDatePointer.set(this.yieldCurves.length - 1);
    });


    this.startDatePointer$.subscribe((value: number) => {
      this.animationPlot(this.yieldCurves[value]);
    });

  }

  public playAnimation() {
    let nextPointer = this.startDatePointer();
    const maxPointer = this.maxDatePointer();
    this.playButtonDisabled.set(true);
    this.pauseButtonDisabled.set(false);
    this.resetButtonDisabled.set(false);
    this.subscription = this.interval.subscribe(() => {
      if (nextPointer >= maxPointer) {
        this.subscription.unsubscribe();
        return;
      }
      nextPointer += 14;
      if (nextPointer > maxPointer) {
        nextPointer = maxPointer;
        this.pauseButtonDisabled.set(true);
        this.resetButtonDisabled.set(false);
      }
      this.startDatePointer.set(nextPointer);
    });

  }

  public resetAnimation() {
    this.subscription.unsubscribe();
    this.startDatePointer.set(0);
    this.playButtonDisabled.set(false);
    this.pauseButtonDisabled.set(true);
    this.resetButtonDisabled.set(true);
  }

  public pauseAnimation() {
    this.subscription.unsubscribe();
    this.playButtonDisabled.set(false);
    this.pauseButtonDisabled.set(true);
    this.resetButtonDisabled.set(false);
  }

  private animationPlot(yieldCurve: any) {
    const displayDate = (new Date(yieldCurve.date)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const curveDate = new Date(yieldCurve.date);
    const isRecession = this.recessionData.find(d =>
      d.date.getFullYear() === curveDate.getFullYear() &&
      d.date.getMonth() === curveDate.getMonth() &&
      d.date.getDate() === curveDate.getDate()
    )?.value ?? 0;

    // remove all but one series
    this.chart.series.length > 1 ? this.chart.series.forEach(s => s.remove(true)) : null;
    this.chart.series[0]?.update({ type: 'spline', name: `${displayDate} ${isRecession === 1 ? '(Recession)' : ''}`, color: isRecession === 1 ? 'red' : undefined, data: yieldCurve.points }, true);
  }
  private _setupChart() {
    const container = this.el.nativeElement.querySelector('#chart');
    this.chart = new Highcharts.Chart(container, {
      chart: {
        height: 550,
        shadow: { color: 'grey', offsetX: 1, offsetY: 1 },
        borderRadius: 5,
        animation: false,
        zooming: {
          type: 'x',
        }
      },
      caption: {
        text: this.graph.caption,
      },
      credits: {
        enabled: false,
        text: `Pearson Education`,
        style: { color: '#616262' },
        href: 'javascript:window.open("https://www.pearson.com/", "_blank")',
      },
      title: {
        text: this.graph.title,
        style: {
          fontFamily: 'sans-serif',
          fontWeight: '300',
          fontSize: '1.2em'
        }
      },
      legend: { enabled: false },
      tooltip: {
        headerFormat: '{series.name}<br/>',
        pointFormat: '{point.name}: {point.y:.2f}%',
      },
      accessibility: {
        point: {
          valueDescriptionFormat: `{point.name}: {point.y:.2f}%`
        },
        keyboardNavigation: {
          order: ['container', 'series', 'chartMenu']
        }
      },
      series: [
      ],
      xAxis: {
        lineColor: '#757575',
        lineWidth: 1.,
        tickColor: '#757575',
        title: { useHTML: true, text: this.graph.xTitle },
        tickInterval: this.graph.xInterval,
        //  tickPositions: [0, 5, 10, 15, 20, 25, 30], // Explicit tick positions
        labels: {
          formatter: function (): string {
            const tickValue = this.value as number;
            return `${tickValue}`;
          }
        }
      },
      yAxis: {
        gridLineWidth: 0,
        lineColor: '#757575',
        lineWidth: 1.,
        tickColor: '#757575',
        tickWidth: 1,
        title: { useHTML: true, text: this.graph.yTitle },
        min: this.graph.yMin,
        max: this.graph.yMax,
        tickInterval: this.graph.yInterval,
        labels: {
          format: '{value:.0f}%'
        }
      },
      plotOptions: {
        series: {
          marker: { enabled: true, symbol: 'circle', radius: 4 },
          label: { enabled: true }
        }
      },

    });
  }

  public dateFilter = (d: Date | null): boolean => {
    if (!d) return false; // Explicitly handle null dates
    const day = d.getDay(), now = new Date();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0 && day !== 6 && d < now && d.getFullYear() > 1989;
  };

  public reset() {
    while (this.chart.series.length > 0) {
      this.chart.series[0].remove(true);
    }
    this.chart.setTitle({ text: 'Use Date Picker to Add a Yield Curve' });
    // this.selectedDate.set(new Date('2025-01-01T00:00:00'));
    this.liveAnnouncer.announce('All yield curves have been removed.');
  }

  private _addDataSeries(value: any) {
    //const date = new Date("2023-01-04");
    if (value.getDay() === 6) value = new Date(value.setDate(value.getDate() + 2));
    if (value.getDay() === 0) value = new Date(value.setDate(value.getDate() + 1));

    const year = value.getFullYear();

    const dateString = `${year}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;

    // check the date against the recession data and return true if the value on that date is 1
    const isRecession = (this.recessionData.find(d => d.date.getFullYear() === value.getFullYear() && d.date.getMonth() === value.getMonth() && d.date.getDate() === value.getDate()))?.value;


    this.treasuryService.postData({
      startDate: dateString,
      endDate: dateString
    })
      .subscribe((data: any) => {
        const displayDate = value.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        if (data.data.length === 0) {
          window.alert('No yield curve data available for the selected date.');
          return;
        }

        const points = [
          { name: '1-month', x: 1 / 12, y: data.data[0].rates['1month'] },
          { name: '1.5-month', x: 1 / 8, y: data.data[0].rates['1_5month'] },
          { name: '3-month', x: 1 / 4, y: data.data[0].rates['3month'] },
          { name: '4-month', x: 1 / 3, y: data.data[0].rates['4month'] },
          { name: '6-month', x: 1 / 2, y: data.data[0].rates['6month'] },
          { name: '1-year', x: 1, y: data.data[0].rates['1year'] },
          { name: '2-year', x: 2, y: data.data[0].rates['2year'] },
          { name: '3-year', x: 3, y: data.data[0].rates['3year'] },
          { name: '5-year', x: 5, y: data.data[0].rates['5year'] },
          { name: '7-year', x: 7, y: data.data[0].rates['7year'] },
          { name: '10-year', x: 10, y: data.data[0].rates['10year'] },
          { name: '20-year', x: 20, y: data.data[0].rates['20year'] },
          { name: '30-year', x: 30, y: data.data[0].rates['30year'] }
        ];
        this.chart.addSeries({
          type: 'spline',
          lineWidth: 2,
          color: isRecession === 1 ? 'red' : undefined,
          name: `${displayDate} ${isRecession === 1 ? '(Recession)' : ''}`,
          data: points,
          connectNulls: true,
        });

        const title = this.chart.series.length > 1 ? `Selected Yield Curves` : `Selected Yield Curve`;
        this.chart.setTitle({ text: title });

      });
    this.liveAnnouncer.announce(`The yield curve for ${dateString} has been added.`);
  }
}
