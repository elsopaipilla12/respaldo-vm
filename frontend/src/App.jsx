import { useState, useEffect } from 'react';

function App() {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 1. Obtener los mensajes al cargar la página
  useEffect(() => {
    // Apuntamos a la ruta de mensajes de Búsqueda
    fetch('http://localhost:3000/api/busqueda/messages')
      .then(respuesta => respuesta.json())
      .then(datos => {
        setMensajes(datos);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error obteniendo mensajes:", error);
        setCargando(false);
      });
  }, []);

  // 2. Función para enviar una reacción (Aquí conectarás con TU backend)
  const enviarReaccion = (mensajeId, tipoReaccion) => {
    console.log(`Enviando reacción '${tipoReaccion}' al mensaje ${mensajeId}...`);
    
    // Pronto reemplazarás esto con un fetch a tu servicio:
    /*
    fetch('http://localhost:3000/api/reacciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: mensajeId, reaction_type: tipoReaccion, user_id: 1 })
    })
    .then(res => res.json())
    .then(data => console.log("Reacción guardada:", data));
    */
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Chat del Grupo</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', minHeight: '400px' }}>
        {cargando ? (
          <p>Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <p>No hay mensajes en el chat todavía.</p>
        ) : (
          mensajes.map((msg, index) => (
            <div key={index} style={{ background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {/* Ajusta 'msg.content' o 'msg.text' según cómo venga el JSON de tus compañeros */}
              <p style={{ margin: '0 0 10px 0' }}>{msg.content || msg.text || JSON.stringify(msg)}</p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => enviarReaccion(msg.id, 'like')} style={{ cursor: 'pointer', padding: '5px 10px' }}>👍 Like</button>
                <button onClick={() => enviarReaccion(msg.id, 'heart')} style={{ cursor: 'pointer', padding: '5px 10px' }}>❤️ Corazón</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;