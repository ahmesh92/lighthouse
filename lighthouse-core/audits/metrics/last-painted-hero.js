/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../audit');
const i18n = require('../../lib/i18n/i18n.js');
const ComputedLastPaintedHero = require('../../computed/metrics/last-painted-hero.js');

const UIStrings = {
  /** The name of the metric that marks the time at which the last of the "hero" elements was painted. A "hero" element is the largest header text or largest image element. Shown to users as the label for the numeric metric value. Ideally fits within a ~40 character limit. */
  title: 'Last Painted Hero',
  /** Description of the Last Painted Hero metric, which marks the time at which the last of the "hero" elements was painted. A "hero" element is the largest header text or largest image element. This is displayed within a tooltip when the user hovers on the metric name to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'Last Painted Hero marks the time at which the last of the "hero" elements was ' +
      'painted. A "hero" element is the largest header text or largest image element. ' +
      '[Learn more](https://developers.google.com/web/tools/lighthouse/audits/first-contentful-paint).',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class LastPaintedHero extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'last-painted-hero',
      title: str_(UIStrings.title),
      description: str_(UIStrings.description),
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['traces', 'devtoolsLogs', 'HeroElements', 'ViewportDimensions'],
    };
  }

  /**
   * @return {LH.Audit.ScoreOptions}
   */
  static get defaultOptions() {
    return {
      // 75th and 95th percentiles HTTPArchive -> median and PODR
      // https://bigquery.cloud.google.com/table/httparchive:lighthouse.2018_04_01_mobile?pli=1
      // see https://www.desmos.com/calculator/2t1ugwykrl
      scorePODR: 2000,
      scoreMedian: 4000,
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const trace = artifacts.traces[Audit.DEFAULT_PASS];
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const heroElements = artifacts.HeroElements;
    const viewport = artifacts.ViewportDimensions;
    const metricData = {heroElements, viewport, trace, devtoolsLog, settings: context.settings};
    const metricResult = await ComputedLastPaintedHero.request(metricData, context);

    return {
      score: Audit.computeLogNormalScore(
        metricResult.timing,
        context.options.scorePODR,
        context.options.scoreMedian
      ),
      rawValue: metricResult.timing,
      displayValue: str_(i18n.UIStrings.seconds, {timeInMs: metricResult.timing}),
    };
  }
}

module.exports = LastPaintedHero;
module.exports.UIStrings = UIStrings;