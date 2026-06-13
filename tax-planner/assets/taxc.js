//Income Computation 
function computeIncome(){
	var sum = 0;
	$('.income').each(function(){
		sum += parseFloat(this.value);
	});
	if(sum!==0){
	$('#incomeValue').val(sum)};
};

//Investment Computation
function computeInvestments(){
	var sum = 0;
	$('.80c').each(function(){
		sum += parseFloat(this.value);
	})
	if(sum!==0){
		sum = Math.min(sum, 150000);
	}
	$('#investmentsValue').text(sum);
	
};

//Deduction Computation
function computeDeductions(){
	var sum = 0;
	$('.deduction').each(function(){
		sum += parseFloat(this.value);
	})
	$('#deductionsValue').text(sum);
	
};

//Excemption Computation
function computeExcemptions(){
	var sum = 0;
	$('.excemption').each(function(){
		sum += parseFloat(this.value);
	})
	$('#excemptionValue').text(sum);
};

//Taxable Computation
function computeTaxable(income){
	var deductions = parseInt($('#deductionsValue').text()) +parseInt($('#excemptionValue').text())+
					 parseInt($('#investmentsValue').text())+52400; /* 50000 - Standard Deduction , 2400 Professional Tax*/;
	var taxable = income-deductions;
	$('#taxable').text(Math.max(0,taxable));

};

//Tax Computation
function computeTax(taxable){
	if(taxable >0){
	var tax = Math.max(0.05*(taxable-250000) +0.15*Math.max(0,taxable-500000)+0.10*Math.max(0,taxable -1000000),0);
	if(tax<=12500) 
		return 0;
	else
		return tax;
	}
}

//Summary Generator
function summarize(){
	$('#message').empty();
	$("#message").append('<li>Out of your specified Total Income of '+$("#incomeValue").val() + ','+$('#taxable').text() + ' is your taxable Income</li>');
	$("#message").append('<li>Total excemptions, Deductions from 80C and Other deductions amount to '+$('#excemptionValue').text()+' ,'+$('#investmentsValue').text()+' and '+$('#deductionsValue').text()+' respectively.</li>');
	$("#message").append('<li>You are liable for paying '+$('#taxtobepaid').text()+' plus the taxes(surcharge and Education Cess), amounting to '+$('#payable').text()+'</li>');
	recommandDeductions();
}
	
	
$( "input" ).change(function() {
	if($(this).attr("id") =="name"){
		$('#user').text(this.value+ ', ');
	}
	else {
		this.value = Math.abs(this.value);
	}
	if($(this).attr("id") =="incomeValue"){
		$('.income').each(function(){
		this.value = 0;
	});
	};
	computeIncome();
	computeExcemptions();
	computeInvestments();
	computeDeductions();
	computeTaxable($("#incomeValue").val());
	$('#taxtobepaid').text(computeTax($('#taxable').text()));
	$('#payable').text(1.04*parseInt($('#taxtobepaid').text()));
	summarize();
});

function recommandDeductions(){
	var investment= $('#investmentsValue').text();
	if(parseInt($('#payable').text())>0 && investment <150000){
		$("#message").append('<li class = "recommandation">You can save '+(parseInt($('#taxtobepaid').text())-computeTax($('#taxable').text()-(150000-investment)))+' on taxes by investing '+
		(150000-investment)+' more under 80C.</li>');
	}
		
}
