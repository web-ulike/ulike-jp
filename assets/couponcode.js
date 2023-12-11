var cpnBtn = document.getElementById('cpnBtn');
if(cpnBtn){
 var cpnCode = document.getElementById('cpnCode');
   cpnBtn.onclick = function() {
     navigator.clipboard.writeText(cpnCode.innerHTML);
     cpnBtn.innerHTML = "Copied";
     cpnBtn.classList.add('copyActive');
     setTimeout(()=>{
       cpnBtn.innerHTML = "Copy Code";
       cpnBtn.classList.remove('copyActive');
     },3000)
   }
}

var cpnBtn1 = document.getElementById('cpnBtn1');
if(cpnBtn1){
 var cpnCode1 = document.getElementById('cpnCode1');
   cpnBtn1.onclick = function() {
     navigator.clipboard.writeText(cpnCode1.innerHTML);
     cpnBtn1.innerHTML = "Copied";
     cpnBtn1.classList.add('copyActive');
     setTimeout(()=>{
       cpnBtn1.innerHTML = "Copy Code";
       cpnBtn1.classList.remove('copyActive');
     },3000)
   }
}