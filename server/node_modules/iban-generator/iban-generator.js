(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['exports', 'iban'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
      // CommonJS
      factory(exports, require('iban'));
  } else {
      // Browser globals
      factory((root.ibanGenerator = {}), root.IBAN);
  }
}(this, function (exports, iban) {

  var _randomNumber = function(n){
    var num = "";
    for(var index=0; index < n; index++ ){
      num += Math.floor((Math.random() * 10) + 1);
    }
    return num;
  }
  var _calculaDCParcial = function(cadena){
  	var dcParcial = 0;
  	var tablaPesos = [6,3,7,9,10,5,8,4,2,1];
  	var suma = 0;
  	var i;
  	for(i=0;i<cadena.length;i++){
  		suma = suma + cadena.charAt(cadena.length-1-i)*tablaPesos[i];
  	}
  	dcParcial = (11-(suma % 11));
  	if(dcParcial==11)
  		dcParcial=0;
  	else if(dcParcial==10)
  		dcParcial=1;
  	return dcParcial.toString();
  }

  exports.randomNumber = function(){
    var entitat = _randomNumber(4);
    var oficina = _randomNumber(4);
    var compte = _randomNumber(10);
    return entitat+oficina+compte;
  }
  exports.controlDigit = function(n){
    var ncc = n.replace(/ /g,'');
    var entitat_oficina = ncc.substring(0,8);
    var cc = ncc.substring(ncc.length-10,ncc.length);

    var dc1 = _calculaDCParcial(entitat_oficina);
    var dc2 = _calculaDCParcial(cc);
    return (dc1+dc2);
  }
  exports.fixCCC = function(n){
    var ncc = n.replace(/ /g,'');
    var dc = this.controlDigit(n);
    return (ncc.substring(0,8)+dc+ncc.substring(ncc.length-10,ncc.length));
  }
  exports.doIban = function(ccc) {
    return(iban.fromBBAN("ES",ccc));
  }
  exports.checkIban = function(i) {
    return(iban.isValid(i));
  }

}));
