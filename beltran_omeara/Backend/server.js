import express from "express";
import cors from "cors";
// Importar 'fetch' si tu versión de Node.js no lo soporta de forma nativa.
// Si Node.js lo soporta, no necesitas esta línea.
// import fetch from "node-fetch"; 

const app = express();
const PORT = 3000;

// Estado del juego en el backend
let pokemonSecreto = null;

// Habilita CORS y middleware para parsear JSON
app.use(cors());
app.use(express.json());

// Función para obtener un Pokémon aleatorio de la PokéAPI
async function fetchPokemon() {
    // Genera un ID aleatorio entre 1 y 898 (Pokémon de Kanto a Galar)
    const randomId = Math.floor(Math.random() * 898) + 1;
    
    // Petición de datos principales del Pokémon
    const resPokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const dataPokemon = await resPokemon.json();
    
    // Petición de la especie (para el color)
    const resSpecies = await fetch(dataPokemon.species.url);
    const dataSpecies = await resSpecies.json();

    // Estructura los datos relevantes
    const pokemon = {
        id: dataPokemon.id,
        name: dataPokemon.name.toLowerCase(), // Nombre en minúsculas para fácil comparación
        types: dataPokemon.types.map(t => t.type.name),
        height: dataPokemon.height / 10, // Convertir de decímetros a metros
        weight: dataPokemon.weight / 10, // Convertir de hectogramos a kilogramos
        color: dataSpecies.color ? dataSpecies.color.name : "unknown",
        moves: dataPokemon.moves.slice(0, 4).map(m => m.move.name), // Tomar solo 4 movimientos
        // URL de la imagen (usamos dream_world si está disponible, sino la normal)
        imageUrl: dataPokemon.sprites.other.dream_world.front_default || dataPokemon.sprites.front_default,
    };

    return pokemon;
}

// 1. Endpoint para iniciar/reiniciar el juego (GET /api/start)
app.get("/api/start", async (req, res) => {
    try {
        pokemonSecreto = await fetchPokemon();
        
        // Objeto a enviar al frontend (solo las pistas)
        const pistas = {
            id: pokemonSecreto.id,
            types: pokemonSecreto.types,
            height: pokemonSecreto.height,
            weight: pokemonSecreto.weight,
            color: pokemonSecreto.color,
            moves: pokemonSecreto.moves,
        };
        
        console.log(`\n\nNuevo Pokémon secreto: ${pokemonSecreto.name}`); // Solo para consola del servidor
        
        res.json({
            mensaje: "Nuevo juego iniciado. Adivina el Pokémon basándote en las pistas.",
            pistas: pistas,
            juegoIniciado: true,
            acertado: false,
            pokemonMostrado: null, // No mostrar el Pokémon al inicio
        });

    } catch (error) {
        console.error("Error al obtener Pokémon:", error);
        res.status(500).json({ mensaje: "Error al iniciar el juego." });
    }
});

// 2. Endpoint para enviar el intento del jugador (POST /api/guess)
app.post("/api/guess", (req, res) => {
    if (!pokemonSecreto) {
        return res.status(400).json({ 
            mensaje: "El juego no ha sido iniciado. Presiona 'Reiniciar Juego'.",
            juegoIniciado: false,
        });
    }

    const intento = req.body.nombrePokemon ? req.body.nombrePokemon.toLowerCase().trim() : '';

    if (!intento) {
        return res.status(400).json({ 
            mensaje: "Debes ingresar un nombre de Pokémon.",
            juegoIniciado: true,
            acertado: false,
        });
    }

    let resultado;
    let acertado;

    if (intento === pokemonSecreto.name) {
        resultado = `¡Correcto! Es ${pokemonSecreto.name}.`;
        acertado = true;
    } else {
        resultado = `Incorrecto. El Pokémon era ${pokemonSecreto.name}.`;
        acertado = false;
    }

    res.json({
        mensaje: resultado,
        acertado: acertado,
        juegoIniciado: true,
        // Enviar el Pokémon completo solo si se acertó o falló para mostrar la imagen
        pokemonMostrado: pokemonSecreto, 
    });
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    // Opcional: Iniciar el juego automáticamente al arrancar el servidor
    // fetchPokemon().then(p => pokemonSecreto = p).catch(console.error);
});