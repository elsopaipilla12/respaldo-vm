import { useState, useEffect } from 'react';

function App() {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [conteoReacciones, setConteoReacciones] = useState({});
  const [datosGamificacion, setDatosGamificacion] = useState(null);
  const [rutaGamificacion, setRutaGamificacion] = useState('/users/fa6b56ef-2eb7-4113-b5b1-72533602130e');

  // 1. Obtener o buscar mensajes en el microservicio de Búsqueda
  const cargarMensajes = (query = '') => {
    setCargando(true);
    // Si hay texto en el buscador, enviamos el query param ?q=... (y también ?query=... por compatibilidad)
    const url = query.trim()
      ? `http://localhost:3000/api/busqueda/messages?q=${encodeURIComponent(query)}&query=${encodeURIComponent(query)}`
      : 'http://localhost:3000/api/busqueda/messages';

    fetch(url)
      .then(respuesta => {
        if (!respuesta.ok) throw new Error(`HTTP error! status: ${respuesta.status}`);
        return respuesta.json();
      })
      .then(datos => {
        let lista = [];
        if (Array.isArray(datos)) {
          lista = datos;
        } else if (datos && Array.isArray(datos.messages)) {
          lista = datos.messages;
        } else if (datos && Array.isArray(datos.results)) {
          lista = datos.results;
        }

        // Si el backend de búsqueda no filtró por query param, filtramos localmente como respaldo
        if (query.trim() && lista.length > 0) {
          lista = lista.filter(m =>
            (m.content || m.text || '').toLowerCase().includes(query.toLowerCase())
          );
        }

        setMensajes(lista);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error obteniendo mensajes:", error);
        setMensajes([]);
        setCargando(false);
      });
  };

  // 2. Consultar datos del microservicio de Gamificación
  const consultarGamificacion = (endpoint = rutaGamificacion) => {
    fetch(`http://localhost:3000/api/gamificacion${endpoint}`)
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Status ${res.status}: ${errText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Datos de gamificación recibidos:", data);
        setDatosGamificacion(data);
      })
      .catch(err => {
        console.warn("No se pudo obtener gamificación en esa ruta:", err.message);
        setDatosGamificacion({ aviso: `Ruta ${endpoint} devolvió: ${err.message}` });
      });
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  // 3. Enviar reacción a TU microservicio (y disparar evento a RabbitMQ)
  const enviarReaccion = (mensajeId, tipoReaccion, channelId, userId) => {
    console.log(`Enviando reacción '${tipoReaccion}' al mensaje ${mensajeId} con usuario ${userId}...`);
    
    fetch('http://localhost:3000/api/reacciones/api/v1/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message_id: String(mensajeId), 
        reaction_type: tipoReaccion, 
        user_id: String(userId), 
        channel_id: channelId ? String(channelId) : "general"
      })
    })
    .then(async res => {
      if (!res.ok) {
        const detalleError = await res.text();
        throw new Error(`Error en el servidor: ${res.status} - ${detalleError}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("¡Reacción guardada y enviada a RabbitMQ con éxito!:", data);
      
      // Actualizamos el contador visual en el frontend
      const clave = `${mensajeId}_${tipoReaccion}`;
      setConteoReacciones(prev => ({
        ...prev,
        [clave]: (prev[clave] || 0) + 1
      }));

      // Actualizamos el panel de gamificación con el usuario que reaccionó
      consultarGamificacion(`/users/${userId}`);
    })
    .catch(error => console.error("Fallo al enviar la reacción:", error));
  };

  const manejarSubmitBusqueda = (e) => {
    e.preventDefault();
    cargarMensajes(busqueda);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Chat del Grupo (Integración de Microservicios)</h1>

      {/* PANEL DE BÚSQUEDA */}
      <form onSubmit={manejarSubmitBusqueda} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar mensajes (ej. reunion, hola, buenos dias)..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>🔍 Buscar</button>
        <button type="button" onClick={() => { setBusqueda(''); cargarMensajes(''); }} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Limpiar
        </button>
      </form>

      {/* PANEL DE GAMIFICACIÓN */}
      <div style={{ background: '#eef6ff', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #b3d4fc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <strong>🏆 Estado de Gamificación:</strong>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              value={rutaGamificacion}
              onChange={(e) => setRutaGamificacion(e.target.value)}
              style={{ padding: '4px 8px', width: '260px', fontSize: '12px' }}
              title="Endpoint del servicio de gamificación"
            />
            <button onClick={() => consultarGamificacion(rutaGamificacion)} style={{ padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
              Consultar
            </button>
          </div>
        </div>
        {datosGamificacion && (
          <pre style={{ background: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px', marginTop: '10px', overflowX: 'auto' }}>
            {JSON.stringify(datosGamificacion, null, 2)}
          </pre>
        )}
      </div>

      {/* LISTA DE MENSAJES Y REACCIONES */}
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', minHeight: '400px' }}>
        {cargando ? (
          <p>Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <p>No se encontraron mensajes.</p>
        ) : (
          mensajes.map((msg, index) => {
            const idMensaje = msg.id || msg.message_id;
            const idUsuario = msg.user_id || msg.author_id || msg.sender_id || msg.user || "1";
            const likes = conteoReacciones[`${idMensaje}_like`] || 0;
            const hearts = conteoReacciones[`${idMensaje}_heart`] || 0;

            return (
              <div key={idMensaje || index} style={{ background: 'white', padding: '12px', marginBottom: '10px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{msg.content || msg.text || JSON.stringify(msg)}</p>
                <small style={{ color: '#666', display: 'block', marginBottom: '10px', fontSize: '11px' }}>
                  Autor: {idUsuario} | Canal: {msg.channel_id}
                </small>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => enviarReaccion(idMensaje, 'like', msg.channel_id, idUsuario)}
                    style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: '4px', border: '1px solid #ccc', background: likes > 0 ? '#e6f4ea' : '#f9f9f9' }}
                  >
                    👍 Like {likes > 0 && `(${likes})`}
                  </button>
                  <button
                    onClick={() => enviarReaccion(idMensaje, 'heart', msg.channel_id, idUsuario)}
                    style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: '4px', border: '1px solid #ccc', background: hearts > 0 ? '#fce8e6' : '#f9f9f9' }}
                  >
                    ❤️ Corazón {hearts > 0 && `(${hearts})`}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;