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
import { BusPubLibModule } from 'bus-pub-lib';
import { MatButtonModule } from '@angular/material/button';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';

// extend Highcharts Point type to support additional properties
declare module 'highcharts' {
  interface Point {
    stockA?: string;
    stockB?: string;
  }
}

@Component({
  selector: 'app-interactive04',
  imports: [CommonModule, BusPubLibModule, MatButtonModule, MatInputModule],
  templateUrl: './interactive04.component.html',
  styleUrl: './interactive04.component.scss'
})

export class Interactive04Component implements OnInit {

  chart!: Highcharts.Chart;
  title: WritableSignal<string> = signal('Portfolios of Two Risky Assets');

  // graph properties

  graph = {
    title: 'Portfolios of stocks A and B',
    caption: `The graph shows the relation between the standard deviation and expected return of a portfolio consisting of various combinations of two risky assets. Hover over the graph to see the details of the current allocation point. Change the portfolio weights slider to set other allocation points.`,
    xTitle: 'Portfolio Standard Deviation',
    yTitle: 'Portfolio Return',
    xMin: 0,
    xMax: .5,
    xInterval: .05,
    yMin: 0,
    yMax: .35,
    yInterval: .05
  }

  // signals for sliders
  correlation: WritableSignal<number> = signal(0);
  expectedReturnA: WritableSignal<number> = signal(.16);
  expectedReturnB: WritableSignal<number> = signal(.06);
  stdDevA: WritableSignal<number> = signal(0.3);
  stdDevB: WritableSignal<number> = signal(0.2);
  shareA: WritableSignal<number> = signal(0.5);

  //observables subscribe to react to value changes
  correlation$ = toObservable(this.correlation);
  shareA$ = toObservable(this.shareA);
  expectedReturnA$ = toObservable(this.expectedReturnA);
  expectedReturnB$ = toObservable(this.expectedReturnB);
  stdDevA$ = toObservable(this.stdDevA);
  stdDevB$ = toObservable(this.stdDevB);

  constructor(private el: ElementRef, private liveAnnouncer: LiveAnnouncer) { }

  ngOnInit(): void {
    this._setupChart();

    this.shareA$.subscribe(() => {
      const series = this._createSeries();
      this.chart.series[1].setData(series.allocationPoint, true, false, false);
    });

    // subscribe to sliders for expected returns and volatility. Output and allocation point series need to be updated
    this.correlation$.subscribe(() => this._updateChart());
    this.expectedReturnA$.subscribe(() => this._updateChart());
    this.expectedReturnB$.subscribe(() => this._updateChart());
    this.stdDevA$.subscribe(() => this._updateChart());
    this.stdDevB$.subscribe(() => this._updateChart());

  }

  private _setupChart() {
    const series = this._createSeries();
    const container = this.el.nativeElement.querySelector('#chart');
    this.chart = new Highcharts.Chart(container, {
      chart: {
        height: 550,
        shadow: { color: 'grey', offsetX: 1, offsetY: 1 },
        borderRadius: 5,
        animation: false,
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
        useHTML: true, 
        enabled: true,
        followPointer: false
      },
      accessibility: {
        point: {
          valueDescriptionFormat: `quantity: {point.x:.0f}, {point.name}: {point.y:.0f} dollars.`
        },
        keyboardNavigation: {
          order: ['container', 'series', 'chartMenu']
        }
      },
      series: [
        {
          type: 'line',
          name: 'Portfolio',
          dashStyle: 'Solid',
          lineWidth: 2,
          color: '#2D629F',
          zIndex: 1,
          data: series.output,
          marker: { enabled: false, symbol: 'circle', radius: 4, lineColor: 'black', lineWidth: 1, fillColor: 'white' },
          label: { enabled: false },
          enableMouseTracking: false
        },
        {
          type: 'line',
          name: 'Allocation point',
          color: 'maroon',
          zIndex: 2,
          data: series.allocationPoint,
          marker: { enabled: true, symbol: 'circle', radius: 4, lineColor: 'black', lineWidth: 1, fillColor: 'white' }
        }
          
      ],
      xAxis: {
        lineColor: '#757575',
        lineWidth: 1.,
        tickColor: '#757575',
        title: { useHTML: true, text: this.graph.xTitle },
        min: this.graph.xMin,
        max: this.graph.xMax,
        tickInterval: this.graph.xInterval,
        labels: {
          formatter: function () {
            return (+this.value * 100).toFixed(0) + '%';
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
          formatter: function () {
            return (+this.value * 100).toFixed(0) + '%';
          }
        }
      },
      plotOptions: {
        series: {
          marker: { enabled: false, symbol: 'circle', radius: 2 },
          tooltip: {
            headerFormat: '<b>{series.name}</b><br/>',
            pointFormatter: function () {
              return `Stock A share: ${this.stockA}<br/>Stock B share: ${this.stockB}<br/>Expected return: ${(this.y! * 100).toFixed(1)}%<br/>Portfolio standard deviation: ${(this.x! * 100).toFixed(1)}%`;
              
            },
            distance: 16
          },
          label: { enabled: true },
          dataLabels: {
            enabled: false,
            format: '{point.name}'
          }
        }
      },

    });
  }

  private _createSeries() {
    let portfolio: any[] = [];
    const sdA = this.stdDevA(), sdB = this.stdDevB(), exA = this.expectedReturnA(), exB = this.expectedReturnB(), corrAB = this.correlation(), shA = this.shareA(), shB = 1 - shA;

    const covAB = corrAB * sdA * sdB, varA = sdA * sdA, varB = sdB * sdB;


    // xA and xB represent the share of the portfolio invested in asset A and B, respectively
    let xA = 0, xB = 0;

    while (xA + xB <= 1) {
      const wA = 1 - xB, wB = xB;
      const expReturn = wA * exA + wB * exB;
      const risk = Math.sqrt(wA * wA * varA + wB * wB * varB + 2 * wA * wB * covAB);
      portfolio.push({ x: risk, y: expReturn, stockA: `${(wA * 100).toFixed(0)}%`, stockB: `${(wB * 100).toFixed(0)}%` });
      xB += 0.01;
      xB = parseFloat(xB.toFixed(2));
    }

    // append data labels to the last point
    portfolio[portfolio.length - 1] = { ...portfolio[portfolio.length - 1], name: 'Stock B', dataLabels: { enabled: true, format: '{point.name}', x: 25, y: 20 } };

    // append data labels to the first point
    portfolio[0] = { ...portfolio[0], name: 'Stock A', dataLabels: { enabled: true, format: '{point.name}', x: 25, y: 5 } };

    const allocationPoint = [
      {
        x: Math.sqrt(shA * shA * varA + shB * shB * varB + 2 * shA * shB * covAB),
        y: shA * exA + shB * exB,
        stockA: (shA*100).toFixed(0) + '%',
        stockB: (shB*100).toFixed(0) + '%',

      }
    ]

    //    Compute yMax and xMax values that are 120% of the extremes for the portfolio series. Then update the graph properties.
    const yMax = Math.max(...portfolio.map(p => p.y)) * 1.2;
    const xMin = Math.min(...portfolio.map(p => p.x)) * 0.8;
    const xMax = Math.max(...portfolio.map(p => p.x)) * 1.2;
    this.graph.xMin = xMin;
    this.graph.xMax = xMax;
    this.graph.yMax = yMax;


    return {
      output: portfolio,
      allocationPoint: allocationPoint
    }

  }

  private _updateChart() {
    const series = this._createSeries();
    this.chart.series[0].setData(series.output, false, false, false);
    this.chart.series[1].setData(series.allocationPoint, false, false, false);
    this.chart.xAxis[0].setExtremes(this.graph.xMin <= 0.05 ? 0 : this.graph.xMin, this.graph.xMax, false);
    this.chart.yAxis[0].setExtremes(this.graph.yMin <= 0.05 ? 0 : this.graph.yMin, this.graph.yMax, true);

    this.liveAnnouncer.announce('Chart updated');
  };


  public reset() {
    // set all input values to their initial state and redraw the chart
    this.correlation.set(0);
    this.shareA.set(0.5);
    this.expectedReturnA.set(0.16);
    this.expectedReturnB.set(0.06);
    this.stdDevA.set(0.3);
    this.stdDevB.set(0.2);
    this._updateChart();
  }

  public processInputs(value: string, control: string, inputElement?: HTMLInputElement) {
    // Remove any non-numeric characters except decimal point and negative sign
    let cleanValue = value.replace(/[^0-9.-]/g, '');

    // Handle percentage input (if user enters with % symbol)
    const isPercentage = value.includes('%');
    let decimal = Number(cleanValue);

    // Handle invalid numbers
    if (isNaN(decimal)) {
      decimal = 0;
    }

    // Convert to decimal if it's a percentage or if value > 1 (assuming percentage)
    if (isPercentage || decimal > 1) {
      decimal = decimal / 100;
    }

    // Validate ranges based on control type
    const ranges = {
      expectedReturnA: { min: 0, max: 0.3 },
      expectedReturnB: { min: 0, max: 0.3 },
      stdDevA: { min: 0, max: 0.6 },
      stdDevB: { min: 0, max: 0.6 }
    };

    const range = ranges[control as keyof typeof ranges];
    let wasClamped = false;
    let clampType: 'min' | 'max' | null = null;
    
    if (range) {
      if (decimal < range.min) {
        decimal = range.min;
        wasClamped = true;
        clampType = 'min';
      } else if (decimal > range.max) {
        decimal = range.max;
        wasClamped = true;
        clampType = 'max';
      }
    }

    // Update the signal
    switch (control) {
      case 'expectedReturnA':
        this.expectedReturnA.set(decimal);
        break;
      case 'expectedReturnB':
        this.expectedReturnB.set(decimal);
        break;
      case 'stdDevA':
        this.stdDevA.set(decimal);
        break;
      case 'stdDevB':
        this.stdDevB.set(decimal);
        break;
    }

    // If value was clamped, update the input field to show the actual value
    if (wasClamped && inputElement && range) {
      const currentValue = this.getCurrentSignalValue(control);
      
      setTimeout(() => {
        inputElement.value = (currentValue * 100).toFixed(1) + '%';
        
        // Announce for screen readers and briefly highlight the field
        const fieldName = this.getFieldDisplayName(control);
        let announcement: string;
        
        if (clampType === 'min') {
          const minValue = (range.min * 100).toFixed(0) + '%';
          announcement = `${fieldName} adjusted to minimum value ${minValue}`;
        } else {
          const maxValue = (range.max * 100).toFixed(0) + '%';
          announcement = `${fieldName} adjusted to maximum value ${maxValue}`;
        }
        
        this.liveAnnouncer.announce(announcement);
        
        // Brief visual feedback
        inputElement.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
          inputElement.style.backgroundColor = '';
        }, 1500);
      }, 0);
    }
  }

  private getCurrentSignalValue(control: string): number {
    switch (control) {
      case 'expectedReturnA': return this.expectedReturnA();
      case 'expectedReturnB': return this.expectedReturnB();
      case 'stdDevA': return this.stdDevA();
      case 'stdDevB': return this.stdDevB();
      default: return 0;
    }
  }

   private getFieldDisplayName(control: string): string {
    const names = {
      expectedReturnA: 'Expected Return A',
      expectedReturnB: 'Expected Return B',
      stdDevA: 'Standard Deviation A',
      stdDevB: 'Standard Deviation B'
    };
    return names[control as keyof typeof names] || control;
  }
}
