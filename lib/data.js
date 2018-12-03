'use strict';

const { range } = require('./array');

const SCALAR_TYPES = ['boolean', 'number', 'string', 'undefined'];

// Check if value is scalar
//   value - <any>
// Returns: <boolean>
const isScalar = value => SCALAR_TYPES.includes(typeof value);

// Copy dataset (copy objects to new array)
//   ds - <Object[]>, source dataset to be copied
// Returns: <Object[]>
const copy = ds => ds.slice();

let cloneArray = null;
let cloneObject = null;

// Clone object or array
//   obj - <Object> | <Array>
// Returns: <Object> | <Array>
const clone = obj => {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Array.isArray(obj) ? cloneArray(obj) : cloneObject(obj);
};

const cloneFields = (
  // Clones specified fields from srcObj to dstObj
  srcObj, // source object
  dstObj, // destination object
  fieldNames // iterable containing names of fields needed copying
) => {
  let fieldName, val;
  for (fieldName of fieldNames) {
    val = srcObj[fieldName];
    if (typeof(val) !== 'object' || val === null) {
      dstObj[fieldName] = val;
    } else if (Array.isArray(val)) {
      dstObj[fieldName] = cloneArray(val);
    } else {
      dstObj[fieldName] = cloneObject(val);
    }
  }
};

function cloneArray(arr) {
  const size = arr.length;
  const array = new Array(size);
  cloneFields(arr, array, range(0, size - 1));
  return array;
};

cloneObject = obj => {
  const object = {};
  const keys = Object.keys(obj);
  cloneFields(obj, object, keys);
  return object;
};

let duplicateArray = null;
let duplicateObject = null;

// Duplicate object or array (properly handles prototype and circular links)
//   obj - <Object> | <Array>
// Returns: <Object> | <Array>
const duplicate = obj => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const references = new Map();
  const dup = Array.isArray(obj) ? duplicateArray : duplicateObject;
  return dup(obj, references);
};

const duplicateFields = (
  // Clones specified fields from srcObj to dstObj
  references, // references, same as in duplicateArray and duplicateObject
  srcObj, // source object
  dstObj, // destination object
  fieldNames // iterable containing names of fields needed copying
) => {
  let fieldName, val;
  for (fieldName of fieldNames) {
    val = srcObj[fieldName];
    if (references.has(val)) {
      dstObj[fieldName] = references.get(val);
    } else  if (typeof(val) !== 'object' || val === null) {
      dstObj[fieldName] = val;
    } else if (Array.isArray(val)) {
      dstObj[fieldName] = duplicateArray(val, references);
    } else {
      dstObj[fieldName] = duplicateObject(val, references);
    }
  }
};

function duplicateArray(arr, references) {
  const size = arr.length;
  const array = new Array(size);
  references.set(arr, array);
  duplicateFields(references, arr, array, range(0, size - 1));
  return array;
};

duplicateObject = (obj, references) => {
  let object;
  if (!obj.constructor) {
    object = Object.create(null);
  } else if (obj.constructor.name !== 'Object') {
    object = new obj.constructor(obj.toString());
  } else {
    object = {};
  }
  references.set(obj, object);
  const keys = Object.keys(obj);
  duplicateFields(references, obj, object, keys);
  return object;
};

// Read property by dot-separated path
//   data - <Object>
//   dataPath - <string>, dot-separated path
// Returns: <any>, value
const getByPath = (data, dataPath) => {
  const path = dataPath.split('.');
  let obj = data;
  for (let i = 0; i < path.length; i++) {
    const prop = path[i];
    const next = obj[prop];
    if (next === undefined || next === null) return next;
    obj = next;
  }
  return obj;
};

// Set property by dot-separated path
//   data - <Object>
//   dataPath - <string>, dot-separated path
//   value - <any>, new value
const setByPath = (data, dataPath, value) => {
  const path = dataPath.split('.');
  const len = path.length;
  let obj = data;
  let i = 0, next, prop;
  for (;;) {
    if (typeof obj !== 'object') return false;
    prop = path[i];
    if (i === len - 1) {
      obj[prop] = value;
      return true;
    }
    next = obj[prop];
    if (next === undefined || next === null) {
      next = {};
      obj[prop] = next;
    }
    obj = next;
    i++;
  }
};

// Delete property by dot-separated path
//   data - <Object>
//   dataPath - <string>, dot-separated path
// Returns: <boolean>
const deleteByPath = (data, dataPath) => {
  const path = dataPath.split('.');
  let obj = data;
  const len = path.length;
  for (let i = 0; i < len; i++) {
    const prop = path[i];
    const next = obj[prop];
    if (i === len - 1) {
      if (obj.hasOwnProperty(prop)) {
        delete obj[prop];
        return true;
      }
    } else {
      if (next === undefined || next === null) return false;
      obj = next;
    }
  }
  return false;
};

// Distinctly merge multiple arrays
//   args - <Array[]>, arrays with elements to be merged
// Returns: <Array>
const merge = (...args) => {
  const unique = new Set();
  const ilen = args.length;
  for (let i = 0; i < ilen; i++) {
    const arr = args[i];
    for (let j = 0; j < arr.length; j++) {
      unique.add(arr[j]);
    }
  }
  return [...unique];
};

// Merge multiple objects with merger
//   merger - <Function>
//   objs - <Object[]>, objects to be merged
// Returns: <Object>
const mergeObjects = (merger, ...objs) => {
  const keys = new Set();
  for (const obj of objs) {
    for (const key in obj) {
      keys.add(key);
    }
  }

  const result = {};
  for (const key of keys) {
    const args = new Array(objs.length);
    for (let i = 0; i < objs.length; ++i) {
      args[i] = objs[i][key];
    }
    result[key] = merger(...args);
  }
  return result;
};

module.exports = {
  isScalar,
  copy,
  clone,
  duplicate,
  getByPath,
  setByPath,
  deleteByPath,
  merge,
  mergeObjects,
};
