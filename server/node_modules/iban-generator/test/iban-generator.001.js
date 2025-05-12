var expect = require('expect');
var ig = require('../iban-generator.js');


describe('Testing de ibanGenerator:', function(){
  before(function(){
  })
  it('Generar numeros aleatoris compte', function(){
    expect(ig.randomNumber()).toMatch(/\d{1,}/);
  })
  it('Digit control CCC', function(){
    var ccc = "12345678001234567890"
    var dc = "06"
    expect(ig.controlDigit(ccc)).toBe(dc);
  })
  it('Digit control CCC sense 00', function(){
    var ccc = "123456781234567890"
    var dc = "06"
    expect(ig.controlDigit(ccc)).toBe(dc);
  })
  it('Digit control CCC amb espais', function(){
    var ccc = "1234 5678 1234567890"
    var dc = "06"
    expect(ig.controlDigit(ccc)).toBe(dc);
  })
  it('Fix CCC', function(){
    var ccc = "1234 5678 1234567890"
    var cccfixed = "12345678061234567890"
    expect(ig.fixCCC(ccc)).toBe(cccfixed);
  })
  it('Calcular IBAN', function(){
    var ccc = "12345678061234567890";
    var ibn = "ES6812345678061234567890";
    expect(ig.doIban(ccc)).toBe(ibn);
  })
  it('Validar IBAN correcte', function(){
    var iban = 'ES6812345678061234567890';
    expect(ig.checkIban(iban)).toBe(true);
  })
  it('Validar IBAN incorrecte', function(){
    var iban = 'ES9812345678061234567890';
    expect(ig.checkIban(iban)).toBe(false);
  })


})
