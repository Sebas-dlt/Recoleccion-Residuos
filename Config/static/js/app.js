const form = document.getElementById('myform')

if (form) {
  form.addEventListener('submit',function(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const token = formData.get('csrf_token');

  axios.post('/submit',formData,{
    headers:{
      'X-CSRF_token':token,
      'Content-Type':'multipart/form-data'
    }
  })
  .then(res=>{
    console.log('respuesta: ', res);
    //alert("Datos Enviado correctamente "+ JSON.stringify(res.data) );
    if (res.data['url']){
      window.location.href = res.data['url']  
    }
    
  })
  .catch(err=>{
    console.log('respuesta: ', err.response ? err.response.data : err.message);
    alert("Error");
  });



  });
}

function saludar() {
  let nombre = document.getElementById("nombre");
  let mensaje = nombre.value + " Hola mundo!";
  alertify.alert("Alert Title", mensaje, function () {
    alertify.success("Ok");
  });
}

function cargartabla() {
  axios
    .get("/cargarTabla", {
      params: {
        ID: 12345,
      },
    })
    .then(function (response) {
      alert(response['data'][0]['name']);
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    })
    .finally(function () {
      // always executed
    });
}
