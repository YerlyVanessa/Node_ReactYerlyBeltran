import { useState, useEffect, useCallback } from "react";
import React from 'react';

const buttonBaseStyle = {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    margin: "5px",
    transition: "background-color 0.3s ease"
};

const buttonIntentarStyle = { ...buttonBaseStyle, backgroundColor: "#007bff" };
const buttonReiniciarStyle = { ...buttonBaseStyle, backgroundColor: "#6c757d" };


function App() {
    // Estado de la conexión
    const [mensajeBackend, setMensajeBackend] = useState("Conectando al backend...");
    // Control del selector
    const [juegoSeleccionado, setJuegoSeleccionado] = useState('numero');
    
    // Estados del juego
    const [mensajeJuego, setMensajeJuego] = useState("Selecciona un juego y haz clic en Iniciar.");
    const [intento, setIntento] = useState("");
    const [pistas, setPistas] = useState(null); // Para Pokémon
    const [acertado, setAcertado] = useState(false);
    const [pokemonImagen, setPokemonImagen] = useState(null);


    // Hook de conexión inicial al backend
    useEffect(() => {
        fetch("/api/mensaje")
            .then(res => res.json())
            .then(data => setMensajeBackend(data.texto))
            .catch(() => setMensajeBackend("Error de conexión con el backend."));
    }, []);

    // Función para reiniciar/cambiar el juego (Llamada a /api/start)
    const reiniciarJuego = useCallback(async (gameType) => {
        const gameToStart = gameType || juegoSeleccionado;
        if (!gameToStart) return;
        
        setMensajeJuego("Iniciando juego...");
        setIntento("");
        setAcertado(false);
        setPistas(null);
        setPokemonImagen(null);
        
        try {
            // Envía el tipo de juego como parámetro de consulta
            const res = await fetch(`/api/start?game=${gameToStart}`);
            const data = await res.json();
            
            if (res.ok) {
                setMensajeJuego(data.mensaje);
                setPistas(data.pistas || null); 
                setJuegoSeleccionado(data.game); // Asegura que el selector refleje lo que inició
            } else {
                setMensajeJuego(data.mensaje || "Error al iniciar el juego.");
            }
        } catch (error) {
            setMensajeJuego("Error de red al iniciar el juego.");
        }
    }, [juegoSeleccionado]);
    
    // Inicia el juego automáticamente al cambiar la selección en el <select>
    useEffect(() => {
        if (juegoSeleccionado) {
            reiniciarJuego(juegoSeleccionado);
        }
    }, [juegoSeleccionado, reiniciarJuego]);


    // Función para enviar el intento (Llamada a /api/guess)
    const enviarIntento = async () => {
        if (intento === "" || acertado) return;

        let guessValue;
        if (juegoSeleccionado === 'numero') {
            guessValue = parseInt(intento);
            if (isNaN(guessValue)) {
                setMensajeJuego("Ingresa un número válido.");
                return;
            }
        } else {
            guessValue = intento.toLowerCase(); // Envía el nombre en minúsculas para Pokémon
        }

        try {
            const res = await fetch("/api/guess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guess: guessValue }), // Usa 'guess' como clave
            });
            const data = await res.json();

            if (res.ok) {
                setMensajeJuego(data.mensaje);
                setAcertado(data.acertado || false);
                if (data.pokemonMostrado) {
                    setPokemonImagen(data.pokemonMostrado);
                }
            } else {
                setMensajeJuego(data.mensaje || "Error al enviar el intento.");
            }
        } catch (error) {
            setMensajeJuego("Error de red al enviar el intento.");
        }
    };

    const isInputNumeric = juegoSeleccionado === 'numero';
    
    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", textAlign: "center" }}>
            <h1 style={{ color: "#4caf50" }}>Frontend Operativo</h1>
            <p style={{ fontSize: "0.8rem", color: "#6c757d", marginBottom: "30px" }}>{mensajeBackend}</p>
            
            <hr style={{ width: "80%", margin: "20px auto" }} />
            
            <h2>Selecciona el Proyecto a Revisar:</h2>
            <select
                value={juegoSeleccionado}
                onChange={(e) => setJuegoSeleccionado(e.target.value)}
                style={{ padding: "10px", fontSize: "1rem", borderRadius: "5px", marginBottom: "20px" }}
            >
                <option value="numero">1. Adivina el Número</option>
                <option value="pokemon">2. Adivina el Pokémon</option>
            </select>
            
            <h3>{juegoSeleccionado === 'numero' ? 'Proyecto 1: Adivina el Número (1-100)' : 'Proyecto 2: Adivina el Pokémon'}</h3>
            <p style={{ fontSize: "1.2rem", color: acertado ? '#28a745' : '#3333ff' }}>
                {mensajeJuego}
            </p>

            {/* Renderizar Pistas para Pokémon */}
            {juegoSeleccionado === 'pokemon' && pistas && (
                <div style={{ margin: '20px auto', maxWidth: '400px', border: '1px solid #ddd', padding: '15px', textAlign: 'left', background: '#f9f9f9' }}>
                    <h4>Pistas del Pokémon:</h4>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        <li>**ID:** {pistas.id}</li>
                        <li>**Tipos:** {pistas.types.join(', ')}</li>
                        <li>**Color:** {pistas.color}</li>
                        <li>**Altura:** {pistas.height} m</li>
                        <li>**Peso:** {pistas.weight} kg</li>
                        <li>**Movimientos (4):** {pistas.moves.join(', ')}</li>
                    </ul>
                </div>
            )}
            
            {/* Mostrar Imagen de Pokémon si se acierta */}
            {pokemonImagen && (
                <div style={{ margin: '15px' }}>
                    <img src={pokemonImagen} alt={`Imagen de Pokémon`} style={{ width: '150px' }} />
                </div>
            )}

            <div style={{ margin: "30px 0" }}>
                <input
                    type={isInputNumeric ? "number" : "text"}
                    value={intento}
                    onChange={(e) => setIntento(e.target.value)}
                    placeholder={isInputNumeric ? "Escribe un número" : "Escribe el nombre del Pokémon"}
                    onKeyDown={(e) => { if (e.key === 'Enter') enviarIntento(); }}
                    disabled={acertado}
                    style={{
                        padding: "10px",
                        fontSize: "1rem",
                        borderRadius: "5px",
                        border: "2px solid #ccc",
                        width: isInputNumeric ? "150px" : "250px",
                        textAlign: "center",
                        marginRight: "10px",
                    }}
                />
                <div>
                    <button 
                        onClick={enviarIntento} 
                        style={buttonIntentarStyle}
                        disabled={acertado}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        Intentar
                    </button>
                    <button 
                        onClick={() => reiniciarJuego(juegoSeleccionado)} 
                        style={buttonReiniciarStyle}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                    >
                        Reiniciar/Cambiar Juego
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;