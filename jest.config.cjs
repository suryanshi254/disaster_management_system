/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    "default",
    ["jest-html-reporter", {
      pageTitle: "Unit Test Report",
      outputPath: "reports/unit_report.html"
    }]
  ]
};

