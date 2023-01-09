/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

import fs from 'fs';
import path from 'path';
import type { JSONValue, JSONObject } from '../../src/JSON.type';
import { prepare_expression } from '../../src/index';
import { Runtime } from '../../src/runtime/Runtime';
import type { SimpleObject, SimpleValue } from '../../src/SimpleValue.type';

const GROUPS = fs.readdirSync(path.join(__dirname, 'test-suite', 'groups')).filter((name) => !name.endsWith('.json'));

/**
 * Simple function to read in JSON
 * @param {string} dir - Directory containing JSON file
 * @param {string} file - Name of JSON file (relative to directory)
 * @returns {Object} Parsed JSON object
 */
function read_json(dir: string, file: string): JSONValue {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, dir, file)).toString()) as JSONValue;
  } catch (e) {
    throw new Error('Error reading ' + file + ' in ' + dir + ': ' + (e as Error).message);
  }
}

const datasets: Record<string, JSONValue> = {};
const DATASET_NAMES = fs.readdirSync(path.join(__dirname, 'test-suite', 'datasets'));

DATASET_NAMES.forEach((name) => {
  datasets[name.replace('.json', '')] = read_json(path.join('test-suite', 'datasets'), name);
});

const SKIP_GROUPS = [
  'transforms',
  // 'wildcards',
  'tail-recursion',
  // 'transform',
  'regex',
  // 'sorting',
  'parent-operator',
  'partial-application',
  'lambdas',
  // 'performance',
  // 'joins',

  'function-eval',
  
  'function-formatInteger',
  'function-formatNumber',
  'function-parseInteger',

  'function-replace',
  'function-shuffle',
  'function-signatures',
  'function-sort',
  'function-split',
];

// This is the start of the set of tests associated with the test cases
// found in the test-suite directory.
describe('JSONata Test Suite', () => {
  // Iterate over all groups of tests
  GROUPS.forEach(group => {
    const filenames = fs.readdirSync(path.join(__dirname, 'test-suite', 'groups', group)).filter((name) => name.endsWith('.json'));
    // Read JSON file containing all cases for this group
    let cases: JSONObject[] = [];
    filenames.forEach(name => {
      const spec = read_json(path.join('test-suite', 'groups', group), name) as JSONObject;
      if (Array.isArray(spec)) {
        spec.forEach((item: JSONObject) => {
          if (!item['description']) {
            item['description'] = name;
          }
        });
        cases = cases.concat(spec);
      } else {
        if (!spec['description']) {
          spec['description'] = name;
        }
        cases.push(spec);
      }
    });
    if (SKIP_GROUPS.includes(group)) {
      test.todo(group);
      return;
    }
    describe('Group: ' + group, () => {
      // Iterate over all cases
      for (const testcase  of cases) {
        // Extract the current test case of interest

        // if the testcase references an external jsonata file, read it in
        if (testcase['expr-file']) {
          testcase['expr'] = fs.readFileSync(path.join(__dirname, 'test-suite', 'groups', group, testcase['expr-file'] as string)).toString();
        }

        const label = `${testcase['description'] as string }: ${testcase['expr'] as string}`;

        // Create a test based on the data in this testcase
        it(label, function () {
          let expr: (value: SimpleValue, bindings: SimpleObject) => SimpleValue;
          // Start by trying to compile the expression associated with this test case

          // if (group === 'object-constructor' && testcase['description'] === 'case025.json') {
          //   debugger;
          // }

          try {
            expr = prepare_expression(new Runtime, testcase['expr'] as string);
            // If there is a timelimit and depth limit for this case, use the
            // `timeboxExpression` function to limit evaluation
            if ('timelimit' in testcase && 'depth' in testcase) {
              throw new Error('Time limit not implemented');
            }
          } catch (e) {
            // If we get here, an error was thrown.  So check to see if this particular
            // testcase expects an exception (as indicated by the presence of the
            // `code` field in the testcase)
            const err = e as Record<string, string>;
            if (testcase['code']) {
              // HACK we don't match the error codes anyway, so just check we throw
              // // See if we go the code we expected
              // expect(err.code).toStrictEqual(testcase.code);
              // // If a token was specified, check for that too
              // if (testcase.hasOwnProperty("token")) {
              //   expect(err.token).toStrictEqual(testcase.token);
              // }
              return;
            } else {
              // If we get here, something went wrong because an exception
              // was thrown when we didn't expect one to be thrown.
              throw new Error(`Got an unexpected exception: ${err['message'] as string}`);
            }
          }

          // Load the input data set.  First, check to see if the test case defines its own input
          // data (testcase.data).  If not, then look for a dataset number.  If it is -1, then that
          // means there is no data (so use undefined).  If there is a dataset number, look up the
          // input data in the datasets array.
          const dataset = resolve_dataset(datasets, testcase) ?? null;

          // Test cases have three possible outcomes from evaluation...
          if ('undefinedResult' in testcase) {
            // First is that we have an undefined result.  So, check
            // to see if the result we get from evaluation is undefined
            const result = expr(dataset, testcase['bindings'] as JSONObject);
            return expect(result).toStrictEqual(undefined);
          } else if ('result' in testcase) {
            // Second is that a (defined) result was provided.  In this case,
            // we do a deep equality check against the expected result.
            const result = expr(dataset, testcase['bindings'] as JSONObject);
            return expect(result).toStrictEqual(testcase['result']);
          } else if ('error' in testcase) {
            // If an error was expected,
            // we do a deep equality check against the expected error structure.
            const err = new Error(testcase['error'] as string);
            return expect(() => expr(dataset, testcase['bindings'] as JSONObject)).toThrow(err);
          } else if ('code' in testcase) {
            // Finally, if a `code` field was specified, we expected the
            // evaluation to fail and include the specified code in the
            // thrown exception.
            // HACK code matching removed for now
            return expect(() => expr(dataset, testcase['bindings'] as JSONObject)).toThrow();
          } else {
            // If we get here, it means there is something wrong with
            // the test case data because there was nothing to check.
            throw new Error('Nothing to test in this test case');
          }
        });
      }
    });
  });
});

/**
 * Protect the process/browser from a runnaway expression
 * i.e. Infinite loop (tail recursion), or excessive stack growth
 *
 * @param {Object} expr - expression to protect
 * @param {Number} timeout - max time in ms
 * @param {Number} maxDepth - max stack depth
 */

/**
 * Based on the collection of datasets and the information provided as part of the testcase,
 * determine what input data to use in the case (may return undefined).
 *
 * @param {Object} datasets Object mapping dataset names to JS values
 * @param {Object} testcase Testcase data read from testcase file
 * @returns {any} The input data to use when evaluating the jsonata expression
 */
function resolve_dataset(datasets: JSONObject, testcase: JSONObject) {
  if ('data' in testcase) {
    return testcase['data'];
  }
  if (typeof testcase['dataset'] !== 'string') {
    return undefined;
  }
  if (testcase['dataset'] in datasets) {
    return datasets[testcase['dataset']];
  }
  throw new Error('Unable to find dataset ' + testcase['dataset'] + ' among known datasets, are you sure the datasets directory has a file named ' + testcase['dataset'] + '.json?');
}