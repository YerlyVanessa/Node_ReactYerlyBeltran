import express from "express";
import cors from "cors";
import fetch from 'node-fetch'; // Necesario para la PokéAPI

const app = express();
const PORT = 3000; // Asegúrate de que este puerto coincida con tu vite.config.js

// === ESTADO GLOBAL DEL SERVIDOR ===
let juegoActivo = 'numero'; // El juego que se está jugando actualmente
let numeroSecreto = Math.floor(Math.random() * 100) + 1; // Estado para el juego de Números
let pokemonSecreto = null; // Estado para el juego de Pokémon

// Habilita CORS y middleware para parsear JSON
app.use(cors());
app.use(express.json());

// 0. Endpoint de conexión (Prueba)
app.get("/api/mensaje", (req, res) => {
    res.json({ texto: "Conexión exitosa. ¡Elige y juega!" });
});

// 1. Endpoint para iniciar/cambiar juego (GET /api/start?game=...)
app.get("/api/start", async (req, res) => {
    // Captura el parámetro 'game' del frontend. Si no se especifica, usa el activo.
    const game = req.query.game || juegoActivo; 
    juegoActivo = game;

    if (game === 'numero') {
        // Lógica para Adivina el Número
        numeroSecreto = Math.floor(Math.random() * 100) + 1;
        console.log(`\nJuego: Número. Secreto: ${numeroSecreto}`);
        return res.json({ 
            mensaje: "Nuevo juego de Números iniciado. Adivina entre 1 y 100.",
            game: 'numero'
        });
    } 
    
    if (game === 'pokemon') {
        // Lógica para Adivina el Pokémon (Usa la PokéAPI)
        try {
            const randomId = Math.floor(Math.random() * 898) + 1;
            const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokeSpeciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`);
            
            const pokeData = await pokeRes.json();
            const speciesData = await pokeSpeciesRes.json();
            
            pokemonSecreto = pokeData.name;
            console.log(`\nJuego: Pokémon. Secreto: ${pokemonSecreto}`);

            // Estructura las pistas a enviar al frontend
            const pistas = {
                id: pokeData.id,
                types: pokeData.types.map(t => t.type.name),
                height: pokeData.height / 10, // En metros
                weight: pokeData.weight / 10, // En kg
                color: speciesData.color.name, // Color de la especie
                moves: pokeData.moves.slice(0, 4).map(m => m.move.name), // Primeros 4 movimientos
            };
            
            return res.json({ 
                mensaje: "Nuevo juego de Pokémon iniciado. Adivina con las pistas.",
                pistas: pistas,
                game: 'pokemon'
            });
        } catch (error) {
            console.error("Error al cargar Pokémon:", error);
            return res.status(500).json({ mensaje: "Error interno al cargar el Pokémon." });
        }
    }

    return res.status(400).json({ mensaje: "Juego no válido." });
});

// 2. Endpoint para enviar el intento del jugador (POST /api/guess)
app.post("/api/guess", (req, res) => {
    // Usamos 'guess' para el valor del intento (número o nombre)
    const intento = req.body.guess; 
    let acertado = false;
    let resultado = "Error en la lógica del juego.";

    // --- LÓGICA DEL JUEGO DE NÚMEROS ---
    if (juegoActivo === 'numero') {
        const numeroIntento = parseInt(intento);
        
        if (isNaN(numeroIntento)) {
             resultado = "Debes ingresar un número entero válido.";
        } else if (numeroIntento < numeroSecreto) {
            resultado = "El número secreto es mayor.";
        } else if (numeroIntento > numeroSecreto) {
            resultado = "El número secreto es menor.";
        } else {
            resultado = `¡Correcto! Adivinaste el número ${numeroSecreto}.`;
            acertado = true;
        }
        return res.json({ mensaje: resultado, acertado: acertado });
    } 
    
    // --- LÓGICA DEL JUEGO DE POKÉMON ---
    if (juegoActivo === 'pokemon') {
        const nombreIntento = String(intento).toLowerCase();
        
        if (nombreIntento === pokemonSecreto) {
            resultado = `¡Correcto! Adivinaste a ${pokemonSecreto}.`;
            acertado = true;
        } else {
            resultado = "Nombre incorrecto. ¡Sigue intentando!";
        }

        return res.json({ 
            mensaje: resultado, 
            acertado: acertado,
            // Proporciona la URL de la imagen si acertó
            pokemonMostrado: acertado ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonSecreto}.png` : null
        });
    }

    res.status(400).json({ mensaje: "Juego no inicializado. Usa /api/start." });
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});