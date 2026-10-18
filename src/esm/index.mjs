/**
 * ES module entry point for the Kinetica API.
 *
 * Re-exports the CommonJS build rather than duplicating it, so a program that
 * loads the package both ways still has a single GPUdb class: `instanceof`
 * holds across the boundary and GPUdb.Type is the same object.
 */

// Importing the CommonJS build's default gives its whole module.exports, so
// the class is read off it rather than being the value itself
import api from '../node/index.js';

/**
 * The GPUdb class, matching the default export of the CommonJS and browser
 * builds -- and the shape of the package this replaces, where the module was
 * the constructor.
 */
export default api.GPUdb;

export const GPUdb = api.GPUdb;
export const FileHandler = api.FileHandler;
export const END_OF_SET = api.END_OF_SET;
export const RingList = api.RingList;
export const encode = api.encode;
export const decode = api.decode;
export const decodeRegular = api.decodeRegular;
export const decodeNoInfNan = api.decodeNoInfNan;
export const base64Encode = api.base64Encode;
export const base64Decode = api.base64Decode;
export const Type = api.Type;
export const Column = api.Column;
export const createTransport = api.createTransport;
export const BrowserHttpTransport = api.BrowserHttpTransport;
export const NodeHttpTransport = api.NodeHttpTransport;
export const ResponseTooLargeError = api.ResponseTooLargeError;
export const AvroType = api.AvroType;
export const AvroError = api.AvroError;
export const JSON_ONLY_ENDPOINTS = api.JSON_ONLY_ENDPOINTS;
