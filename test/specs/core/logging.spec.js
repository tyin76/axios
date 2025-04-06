// test/spec/core/logging.spec.js
import axios from "../../../index.js";
import { expect } from "chai";

import {
  enable_request_logging,
  disable_request_logging,
  get_request_log,
  clear_request_log,
  setUpInterceptors,
} from "../../../lib/core/logging.js";

// use this command to just run the tests in this file:
// npx mocha test/specs/core/logging.spec.js --timeout 30000

describe("core:: logging", function () {
  let resetInterceptors;

  before(function () {
    // Set up the axios instance with interceptors
    resetInterceptors = setUpInterceptors(axios);
  });

  after(function () {
    // Reset the interceptors / clean up
    resetInterceptors();
  });

  beforeEach(function () {
    // Clear the request log before each test
    clear_request_log();
  });

  it("should not log requests if logging is not enabled by default", async function () {
    await axios.get("https://httpbin.org/status/200");
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(0);
  });

  it("should log GET requests", async function () {
    enable_request_logging();
    const response = await axios.get("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    expect(logs[0].status).to.equal(200);
    expect(logs[0].method).to.equal("GET");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");
  });

  it("should log POST requests", async function () {
    enable_request_logging();
    const respone = await axios.post("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    expect(logs[0].status).to.equal(200);
    expect(logs[0].method).to.equal("POST");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");
  });

  it("should log DELETE requests", async function () {
    enable_request_logging();
    const response = await axios.delete("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    expect(logs[0].status).to.equal(200);
    expect(logs[0].method).to.equal("DELETE");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");
  });

  it("should log PUT requests", async function () {
    const response = await axios.put("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    expect(logs[0].status).to.equal(200);
    expect(logs[0].method).to.equal("PUT");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");
  });

  it("should return the current list of logged requests", async function () {
    await Promise.all([
      await axios.get("https://httpbin.org/status/200"),
      await axios.post("https://httpbin.org/status/200"),
      await axios.delete("https://httpbin.org/status/200"),
      await axios.put("https://httpbin.org/status/200"),
    ]);

    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(4);
    expect(logs).to.deep.equal([
      { method: "GET", url: "https://httpbin.org/status/200", status: 200 },
      { method: "POST", url: "https://httpbin.org/status/200", status: 200 },
      { method: "DELETE", url: "https://httpbin.org/status/200", status: 200 },
      { method: "PUT", url: "https://httpbin.org/status/200", status: 200 },
    ]);
  });

  it("should clear all recorded log entries", async function () {
    // vertifying the request log
    clear_request_log(); // clear_request_log() is already called in beforeEach, put here just for explicit clarity
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(0);
    expect(logs).to.be.deep.equal([]);
  });

  // REQUESTS WITH ERROR STATUS CODES
  it("should log requests with error codes using Promise.all", async function () {
    enable_request_logging();

    await Promise.all([
      axios.get("https://httpbin.org/status/404").catch(() => {}),
      axios.post("https://httpbin.org/status/404").catch(() => {}),
      axios.delete("https://httpbin.org/status/404").catch(() => {}),
      axios.put("https://httpbin.org/status/404").catch(() => {}),
    ]);

    //verifying the log entries
    const logs = get_request_log();

    expect(logs).to.have.lengthOf(4);

    const expectedLogs = [
      { method: "GET", url: "https://httpbin.org/status/404", status: 404 },
      { method: "POST", url: "https://httpbin.org/status/404", status: 404 },
      { method: "DELETE", url: "https://httpbin.org/status/404", status: 404 },
      { method: "PUT", url: "https://httpbin.org/status/404", status: 404 },
    ];

    // logs should contain the 4 entries, not necessarily in the same order
    expect(logs).to.have.deep.members(expectedLogs);
  });

  it("should NOT log requests since logging is disabled", async function () {
    disable_request_logging();
    await axios.post("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(0);
  });
  //

  it("should log and then not log by toggling enable/disable", async function () {
    // enable
    enable_request_logging();
    await axios.post("https://httpbin.org/status/200");
    // verifying the request log
    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    expect(logs[0].status).to.equal(200);
    expect(logs[0].method).to.equal("POST");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");

    // disable
    disable_request_logging();
    await axios.post("https://httpbin.org/status/200");
    // verifying the request log
    const logs2 = get_request_log();
    expect(logs2).to.have.lengthOf(1);
  });

  it("should return a copy of the log array", async function () {
    enable_request_logging();
    await axios.get("https://httpbin.org/status/200");

    // Get a copy of the logs and modify it
    const logsCopy = get_request_log();
    logsCopy.push({ method: "FAKE", url: "http://fake.com", status: 999 });

    // Verify that the modified copy includes the FAKE log entry
    expect(logsCopy).to.deep.include({
      method: "FAKE",
      url: "http://fake.com",
      status: 999,
    });

    // Verify that the original logs do not include the FAKE log entry
    const newLogs = get_request_log();
    expect(newLogs).to.have.lengthOf(1);
    expect(newLogs[0].method).to.equal("GET");
    expect(newLogs[0].url).to.equal("https://httpbin.org/status/200");
    expect(newLogs[0].status).to.equal(200);
  });

  it("should log network errors with status 500 when no response is received", async function () {
    enable_request_logging();
    try {
      // Using a URL that should fail
      await axios.get("http://nonexistent.domain/");
    } catch (error) {
      // Error is expected, so we catch it and continue
    }

    const logs = get_request_log();
    expect(logs).to.have.lengthOf(1);
    // Verify that default status is logged as "500" when an error with the response occurs
    expect(logs[0].status).to.equal("500");
    // checking method and url
    expect(logs[0].method).to.equal("GET");
    expect(logs[0].url).to.equal("http://nonexistent.domain/");
  });

  it("should correctly log when toggling enable/disable multiple times", async function () {
    // enable logging
    enable_request_logging();
    await axios.get("https://httpbin.org/status/200");

    // disable logging
    disable_request_logging();
    await axios.post("https://httpbin.org/status/200").catch(() => {});

    // enable logging
    enable_request_logging();
    await axios.delete("https://httpbin.org/status/200");

    // verifying the request log
    const logs = get_request_log();
    // Only the requests made when logging was enabled should be logged --> GET and DELETE requests
    expect(logs).to.have.lengthOf(2);

    // Validate second log entry (GET)
    expect(logs[0].method).to.equal("GET");
    expect(logs[0].url).to.equal("https://httpbin.org/status/200");
    expect(logs[0].status).to.equal(200);

    // Validate second log entry (DELETE)
    expect(logs[1].method).to.equal("DELETE");
    expect(logs[1].url).to.equal("https://httpbin.org/status/200");
    expect(logs[1].status).to.equal(200);
  });

  it("should not log requests after interceptors are removed", async function () {
    enable_request_logging();
    // make a request for logging
    await axios.get("https://httpbin.org/status/200");
    const logsBefore = get_request_log();
    expect(logsBefore).to.have.lengthOf(1);
    expect(logsBefore[0].status).to.equal(200);
    expect(logsBefore[0].method).to.equal("GET");
    expect(logsBefore[0].url).to.equal("https://httpbin.org/status/200");

    // Remove the interceptors
    // resetInterceptors is set in the before function at top of file
    resetInterceptors();

    // Make another request with interceptors removed
    // This should not be logged
    await axios.post("https://httpbin.org/status/200");
    const logsAfter = get_request_log();
    // check logs to make sure that the previous request is not logged
    expect(logsAfter).to.have.lengthOf(1);
    expect(logsBefore[0].status).to.equal(200);
    expect(logsBefore[0].method).to.equal("GET");
    expect(logsBefore[0].url).to.equal("https://httpbin.org/status/200");
  });
});
