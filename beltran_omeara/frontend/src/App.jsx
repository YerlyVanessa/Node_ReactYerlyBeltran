import { useState, useEffect } from "react";

// Estilos en línea para el componente principal
const mainStyle = {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    textAlign: "center" 
};

// Estilos para el campo de entrada
const inputStyle = {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "2px solid #ccc",
    width: "250px",
    textAlign: "center",
    marginBottom: "20px"
};

// Estilos base para los botones
const buttonBaseStyle = {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    margin: "0 5px",
    transition: "background-color 0.3s ease"
};

// Estilos específicos para los botones
const buttonIntentarStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#28a745", // Verde
};
const buttonReiniciarStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#007bff", // Azul
};

// Estilos para las pistas
const clueStyle = {
    textAlign: "left",
    maxWidth: "400px",
    margin: "20px auto",
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
};

function App() {
    // Estado del backend (conexión inicial)
    const [mensajeBackend, setMensajeBackend] = useState("Conectando al backend...");
    // Estado del juego
    const [mensajeJuego, setMensajeJuego] = useState("Haz clic en 'Reiniciar Juego' para comenzar.");
    const [intento, setIntento] = useState("");
    const [pistas, setPistas] = useState(null);
    const [pokemonMostrado, setPokemonMostrado] = useState(null);
    const [acertado, setAcertado] = useState(false);

    // Hook de conexión inicial al backend (como el ejemplo anterior, no es crucial para el juego)
    useEffect(() => {
        fetch("/api/mensaje")
            .then(res => res.json())
            .then(data => setMensajeBackend(data.texto))
            .catch(() => setMensajeBackend("Error de conexión con el backend."));
    }, []);

    // Función para reiniciar el juego
    const reiniciarJuego = async () => {
        setMensajeJuego("Cargando Pokémon...");
        setIntento("");
        setPistas(null);
        setPokemonMostrado(null);
        setAcertado(false);

        try {
            const res = await fetch("/api/start");
            const data = await res.json();
            
            if (res.ok) {
                setMensajeJuego(data.mensaje);
                setPistas(data.pistas);
            } else {
                setMensajeJuego(data.mensaje || "Error al reiniciar el juego.");
            }
        } catch (error) {
            setMensajeJuego("Error de red al iniciar el juego.");
        }
    };

    // Función para enviar el intento
    const enviarIntento = async () => {
        if (!pistas) {
            setMensajeJuego("Inicia un nuevo juego primero.");
            return;
        }
        if (intento.trim() === "") {
            setMensajeJuego("Por favor, ingresa el nombre de un Pokémon.");
            return;
        }

        try {
            const res = await fetch("/api/guess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombrePokemon: intento }),
            });
            const data = await res.json();

            if (res.ok) {
                setMensajeJuego(data.mensaje);
                setAcertado(data.acertado);
                setPokemonMostrado(data.pokemonMostrado);
            } else {
                // Manejar errores como "juego no iniciado" o "debes enviar un número"
                setMensajeJuego(data.mensaje || "Error al enviar el intento.");
            }
        } catch (error) {
            setMensajeJuego("Error de red al enviar el intento.");
        }
    };

    // Renderizado de las pistas
    const renderPistas = () => {
        if (!pistas) return null;

        return (
            <div style={clueStyle}>
                <h2>Pistas:</h2>
                <p><strong>ID:</strong> {pistas.id}</p>
                <p><strong>Tipo(s):</strong> {pistas.types.join(", ")}</p>
                <p><strong>Color:</strong> {pistas.color}</p>
                <p><strong>Altura:</strong> {pistas.height} m</p>
                <p><strong>Peso:</strong> {pistas.weight} kg</p>
                <p><strong>Ataques (muestra):</strong> {pistas.moves.join(", ")}</p>
            </div>
        );
    };

    // Renderizado del Pokémon acertado/fallado
    const renderResultado = () => {
        if (!pokemonMostrado) return null;

        return (
            <div style={{ marginTop: "20px" }}>
                <img 
                    src={pokemonMostrado.imageUrl} 
                    alt={pokemonMostrado.name} 
                    style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                />
            </div>
        );
    };

    return (
        <div style={mainStyle}>
            {/* Mensaje de conexión al backend */}
            <h1 style={{ color: "#4caf50" }}>Frontend conectado</h1>
            <p style={{ fontSize: "0.8rem", color: "#6c757d", marginBottom: "30px" }}>{mensajeBackend}</p>
            
            {/* Sección principal del juego */}
            <hr style={{ width: "80%", margin: "20px auto" }} />
            
            <h1>🎮 Juego: Adivina el Pokémon</h1>
            <p style={{ fontSize: "1.2rem", color: acertado ? "#28a745" : "#dc3545" }}>
                {mensajeJuego}
            </p>

            {renderPistas()}
            
            {/* Formulario de intento solo visible si el juego está iniciado y no se ha acertado */}
            {pistas && !acertado && (
                <div style={{ margin: "20px 0" }}>
                    <input
                        type="text"
                        placeholder="Nombre del Pokémon"
                        value={intento}
                        onChange={(e) => setIntento(e.target.value)}
                        style={inputStyle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                enviarIntento();
                            }
                        }}
                    />
                    <div>
                        <button 
                            onClick={enviarIntento} 
                            style={buttonIntentarStyle}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                        >
                            Intentar
                        </button>
                    </div>
                </div>
            )}

            {renderResultado()}

            <div style={{ marginTop: "30px" }}>
                <button 
                    onClick={reiniciarJuego} 
                    style={buttonReiniciarStyle}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                    Reiniciar Juego
                </button>
            </div>
        </div>
    );
}

export default App;