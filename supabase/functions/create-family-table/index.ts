import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

app.post("/create-family-table", async (c) => {
  try {
    const { familyCode } = await c.req.json();
    
    if (!familyCode || typeof familyCode !== 'string') {
      return c.json({ error: "Código de familia requerido" }, 400);
    }

    // Validar formato del código (6 caracteres alfanuméricos)
    if (!/^[A-Z0-9]{6}$/.test(familyCode)) {
      return c.json({ error: "Código de familia inválido" }, 400);
    }

    const tableName = `kv_store_${familyCode}`;
    
    console.log(`📋 Creating table: ${tableName}`);

    // Crear la tabla KV para esta familia
    const { error } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          key TEXT NOT NULL PRIMARY KEY,
          value JSONB NOT NULL
        );
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      return c.json({ error: "Error al crear la tabla" }, 500);
    }

    // Guardar información básica de la familia
    const { error: insertError } = await supabase
      .from(tableName)
      .insert({
        key: 'family-info',
        value: {
          code: familyCode,
          name: `Familia ${familyCode}`,
          createdAt: new Date().toISOString(),
        }
      });

    if (insertError) {
      console.error('❌ Error inserting family info:', insertError);
      // No devolvemos error aquí porque la tabla se creó correctamente
    }

    console.log(`✅ Table ${tableName} created successfully`);
    
    return c.json({ 
      success: true, 
      familyCode,
      tableName,
      message: "Tabla de familia creada exitosamente" 
    });

  } catch (error) {
    console.error("❌ Error in create-family-table:", error);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);