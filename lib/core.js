// Designed to be used with the current v2.0-dev version of Chart.js
// It's not on NPM, but if you'd like to use it you can, install it
// by setting the chart.js version in your package.json to:
// "chart.js": "git://github.com/danmolitor/Chart.js.git#v2.0-dev"

// I'll try to rework this for their 2.0.0 beta as well.

const React = require('react');
const ReactDOM = require('react-dom');
const Chart = require('chart.js');

module.exports = {
  createClass: function(chartType, methodNames, dataKey) {
    let classData = {
      displayName: chartType + 'Chart',
      getInitialState: function() { return {}; },
      render: function() {
        let _props = {
          ref: 'canvass'
        };
        for (let name in this.props) {
          if (this.props.hasOwnProperty(name)) {
            if (name !== 'data' && name !== 'options') {
              _props[name] = this.props[name];
            }
          }
        }
        return React.createElement('canvas', _props);
      }
    };

    const prototypeMethods = ['clear',
                              'stop',
                              'resize',
                              // 'render',
                              'toBase64Image',
                              'generateLegend',
                              'update',
                              'getElementAtEvent',
                              'getElementsAtEvent',
                              'getDatasetAtEvent',
                              'getDatasetMeta',
                              ...methodNames];

    function addMethod(type) {
      classData[type] = function() {
        return this.state.chart[type].apply(this.state.chart, arguments);
      };
    }

    prototypeMethods.forEach(method => addMethod(method));

    classData.componentDidMount = function() {
      this.initializeChart(this.props);
    };


    classData.componentWillUnmount = function() {
      let chart = this.state.chart;
      chart.destroy();
    };

    classData.componentWillReceiveProps = function(nextProps) {
      var chart = this.state.chart;

      if (nextProps.redraw) {
        chart.destroy();	// Reset the array of datasets
        this.initializeChart(nextProps);
      } else {
        // assign all of the properites from the next datasets to the current chart
        nextProps.data.datasets.forEach(function(set, setIndex) {
          
          let chartDataset = {};

          for (let property in set) {
            if (set.hasOwnProperty(property)) {
              chartDataset[property] = set[property];
            }
          }
          
          chart.data.datasets[setIndex] = chartDataset;
        });

        chart.data.labels = nextProps.data.labels;

        chart.update();
      }
    };

    classData.initializeChart = function(nextProps) {
      /**
       * @param {String} takes in string of chartType
       * @return {String} returns a string with valid Chart.js chart type
       * */
      let convertToValidChartType = (type) => {
        let chartTypeMap = {
          'PolarArea' : 'polarArea',
          'HorizontalBar': 'horizontalBar'
        }
        return chartTypeMap[type] || type.toLowerCase();
      }
      const el = ReactDOM.findDOMNode(this);
      const ctx = el.getContext("2d");
      const type = convertToValidChartType(chartType);

      this.state.chart = new Chart(ctx, {
        type: type,
        data: nextProps.data,
        options: nextProps.options
      });
    };


    // return the chartjs instance
    classData.getChart = function() {
      return this.state.chart;
    };

    // return the canvass element that contains the chart
    classData.getCanvass = function() {
      return this.refs.canvass;
    };

    classData.getCanvas = classData.getCanvass;

    return React.createClass(classData);
  }
};
