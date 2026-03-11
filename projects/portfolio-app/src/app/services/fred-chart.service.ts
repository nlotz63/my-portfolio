import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import * as Highcharts from 'highcharts/highstock';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/annotations';
import 'highcharts/modules/series-label';
import 'highcharts/modules/accessibility';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

interface Series {
  series: string;
  units: string;
  fredDate: string;
  seriesName: string;
}

interface CustomChartOptions extends Highcharts.Options {
  customUnit?: string;
  customFrequency?: string;
}

interface ModeData {
  startIndx: number;
  seriesCount: number;
  yLabel: string;
  tooltipUnit: string;
  caption: string;
  title: string;
  frequency: string;
}

@Injectable({
  providedIn: 'root'
})
export class FredChartService {

  public chart!: Highcharts.Chart;
  public chartSetup = false;
  proxy = environment.reverseProxyUrl;

  constructor(private data: DataService) {
    Highcharts.setOptions({
      colors: [
        '#DC2A2A',
        '#007FAA',
        '#9B59B6',
        '#DB0A5B',
        '#1460AA',
        '#406098',
        '#D43900',
        '#007A4B',
        '#005051',
        '#2574A9',
        '#802200',
      ],
    });
  }

  public createChart(container: HTMLElement, series: Series[] | Series, setup: ModeData) {
    series = Array.isArray(series) ? series : [series]; // Ensure series is an array
    if (!this.chartSetup) { this._setupGraph(container, setup); this.chartSetup = true; }

    const requests = series.map((el) => {
      const seriesId = el.series, fredDate = el.fredDate, units = el.units;
      const url = `${this.proxy}`;

      const data = {
        url: 'https://api.stlouisfed.org/fred/series/observations',
        series_id: seriesId,
        units: units,
        observation_start: fredDate,
        file_type: 'json'

      };
      return this.data.postData(url, data);
    });
    // aggregate requests into a single observable using forkJoin to maintain the order of responses.
    forkJoin(requests).subscribe((responses: any[]) => {
      responses.forEach((data, i) => this._processData(data, (series as Series[])[i].seriesName));
    });
  }

  private _setupGraph(container: HTMLElement, setup: ModeData) {
    this._plotRecessions();
    this.chart = new Highcharts.StockChart(container, {
      customUnit: setup.tooltipUnit,
      customFrequency: setup.frequency,
      chart: {
        height: 550,
        shadow: { color: 'grey', offsetX: 1, offsetY: 1 },
        borderRadius: 5,
        animation: false,
        zooming: { type: 'x' },

      },
      caption: {
        useHTML: true,
        text: setup.caption,
      },
      credits: {
        text: `Pearson Education`,
        style: { color: '#616262' },
        href: 'javascript:window.open("https://www.pearson.com/", "_blank")',
      },
      title: {
        text: setup.title,
        style: {
          fontFamily: 'sans-serif',
          fontWeight: '300',
          fontSize: '1.0em'

        }
      },
      legend: { enabled: true },
      tooltip: {
        useHTML: true, enabled: true, split: true,
        formatter: function (): any {
          const unit = (this.series.chart.options as CustomChartOptions).customUnit || 'billion';
          const frequency = (this.series.chart.options as CustomChartOptions).customFrequency || 'm';

          const date = new Date(this.x);
          const month = date.getUTCMonth() + 1;
          const year = date.getUTCFullYear();
          let header = '';
          switch (frequency) {
            case 'm':
              header = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
              break;
            case 'q':
              if (month >= 1 && month <= 3) {
                header = `Q1 ${year}`;
              } else if (month >= 4 && month <= 6) {
                header = `Q2 ${year}`;
              } else if (month >= 7 && month <= 9) {
                header = `Q3 ${year}`;
              } else if (month >= 10 && month <= 12) {
                header = `Q4 ${year}`;
              }
              break;
            default:
              header = `${year}`;
          }

          return [header].concat(this.points ? this.points.map((point: any) => {
            return `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}</b><br/>`
          }) : []);
        }
      },
      accessibility: {
        point: {
          valueDescriptionFormat: `quantity: {point.x:.0f}, price: {point.y:.0f} dollars.`
        },
        keyboardNavigation: {
          order: ['container', 'series', 'chartMenu']
        }
      },
      navigator: { enabled: false },
      rangeSelector: {
        buttons: [
          {
            type: 'year',
            count: 1,
            text: '1Y'
          },
          {
            type: 'year',
            count: 5,
            text: '5Y'
          },
          {
            type: 'year',
            count: 10,
            text: '10Y'
          },

          {
            type: 'all',
            text: 'Max'
          }
        ],
        selected: 5,
        allButtonsEnabled: true
      },
      scrollbar: { enabled: false },

      series: [],
      xAxis: {
        lineColor: '#D4D4D4',
        lineWidth: 1.,
        tickColor: '#757575',
        title: { useHTML: true, text: `Time` },
        min: undefined,
        max: undefined,
        tickInterval: undefined,
        type: 'datetime',
        plotBands: [],
        labels: {
          formatter: function (): any {
            const range = this.axis.max! - this.axis.min!;
            const cuttoff = 11 * 365 * 24 * 3600 * 1000; // 10 years in milliseconds
            const date = new Date(this.value);
            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();
            if (range <= cuttoff && (this.axis.chart.options as CustomChartOptions).customFrequency === 'q') {
              if (month >= 1 && month <= 3) {
                return `Q1 ${year}`;
              } else if (month >= 4 && month <= 6) {
                return `Q2 ${year}`;
              } else if (month >= 7 && month <= 9) {
                return `Q3 ${year}`;
              } else if (month >= 10 && month <= 12) {
                return `Q4 ${year}`;
              }
            } else {
              return `${year}`;
            }

          }

        }
      },
      yAxis: {
        gridLineWidth: 2,
        lineColor: '#757575',
        lineWidth: 0,
        tickColor: '#757575',
        tickWidth: 0,
        gridLineColor: '#D4D4D4',
        opposite: false,
        title: { useHTML: true, text: setup.yLabel },
        min: undefined,
        max: undefined,
        tickInterval: undefined,
      },
      plotOptions: {
        series: {
          animation: true,
          marker: { enabled: false, symbol: 'circle', radius: 2 },
          label: { enabled: false }
        }
      },
    } as CustomChartOptions); // Cast to CustomChartOptions

  }

  private _processData(data: any, name: string = 'series') {

    const parseData = (data: any): any[] => {
      return data.observations.map((obs: any) => {
        const [year, month, day] = obs.date.split('-').map(Number);
        return {
          x: Date.UTC(year, month - 1, day),
          y: parseFloat(obs.value),
          name: name
        };
      });
    }


    const seriesData = parseData(data);
    this.chart.addSeries(
      {
        type: 'line',
        data: seriesData,
        name: name,
      }
    );


  }

  private _plotRecessions() {

    const url = `${this.proxy}`;
    const data = {
      url: 'https://api.stlouisfed.org/fred/series/observations',
      series_id: 'USREC',
      units: 'lin',
      observation_start: '1900-01-01',
      file_type: 'json'
    };
    // Fetch recession data from the FRED API
    // and parse it to create plot bands for the chart.
    this.data.postData(url, data).subscribe((data: any) => {
      const plotBandData = parseData(data);
      const recessionCount = plotBandData[0].length;
      const plotBandArray: any[] = [];
      for (let i = 0; i < recessionCount; i++) {
        let plotBand = {};
        plotBand = {
          color: '#E3E8ED',
          from: plotBandData[0][i],
          to: plotBandData[1][i],
          borderWidth: 1,
          borderColor: '#A8A9AA',
          zIndex: 0,
        };
        plotBandArray.push(plotBand);
      }
      this.chart.xAxis[0].update({
        plotBands: plotBandArray,
      });
    });

    const parseData = (data: any) => {
      let prevValue = -1;
      let currentFrom: any[] = [], currentTo: any[] = [];
      const observations = data.observations;

      data.observations.forEach((obs: any, index: any) => {
        const pointer = index > 1 ? index - 1 : 0;
        const [year, month, day] = observations[pointer].date.split('-').map(Number);
        if (prevValue < obs.value) {
          currentFrom.push(new Date(year, month, day));
        } else if (prevValue > obs.value) {
          currentTo.push(new Date(year, month, day));
        }
        prevValue = obs.value;
      });
      return [currentFrom, currentTo];
    }

  }
}
