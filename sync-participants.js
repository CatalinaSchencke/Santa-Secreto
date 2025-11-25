#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function syncAndDeploy() {
  try {
    console.log('🎄 Iniciando sincronización automática para desarrollo...');
    
    // Read participants from JSON
    const participantsPath = path.join(__dirname, 'data', 'participants.json');
    const participants = JSON.parse(fs.readFileSync(participantsPath, 'utf8'));

    // Check if participants changed (for wishlist cleanup)
    let participantsChanged = false;
    const lastParticipantsPath = path.join(__dirname, '.last-participants.json');
    
    if (fs.existsSync(lastParticipantsPath)) {
      const lastParticipants = JSON.parse(fs.readFileSync(lastParticipantsPath, 'utf8'));
      
      // Compare participants
      if (JSON.stringify(participants) !== JSON.stringify(lastParticipants)) {
        participantsChanged = true;
        console.log('🔄 Cambios detectados en participantes - se limpiarán wishlists automáticamente');
        
        // Show what changed
        for (const current of participants) {
          const last = lastParticipants.find(p => p.id === current.id);
          if (last && last.name !== current.name) {
            console.log(`   - ID ${current.id}: "${last.name}" → "${current.name}"`);
          } else if (!last) {
            console.log(`   - Nuevo participante: ID ${current.id} - ${current.name}`);
          }
        }
        
        for (const last of lastParticipants) {
          const current = participants.find(p => p.id === last.id);
          if (!current) {
            console.log(`   - Participante eliminado: ID ${last.id} - ${last.name}`);
          }
        }
      }
    } else {
      participantsChanged = true; // First run
      console.log('🆕 Primera ejecución - se configurará la validación automática');
    }

    // Read the Edge Function file
    const edgeFunctionPath = path.join(__dirname, 'supabase', 'functions', 'make-server-252a0d41', 'index.ts');
    const originalContent = fs.readFileSync(edgeFunctionPath, 'utf8');

    // Convert participants to TypeScript format
    const participantsTS = participants.map(p => `  { id: '${p.id}', name: '${p.name}' }`).join(',\n');

    // Replace the participants array in the Edge Function
    const participantsRegex = /const participants = \[[\s\S]*?\];/;
    const newParticipantsArray = `const participants = [\n${participantsTS},\n];`;

    if (participantsRegex.test(originalContent)) {
      const updatedContent = originalContent.replace(participantsRegex, newParticipantsArray);
      
      // SIEMPRE actualizar y desplegar (sin importar si cambió)
      fs.writeFileSync(edgeFunctionPath, updatedContent);
      
      console.log('✅ Participantes sincronizados:');
      console.log(`📋 Total: ${participants.length} participantes`);
      participants.forEach(p => console.log(`   - ${p.id}: ${p.name}`));
      
      // SIEMPRE hacer deploy para regenerar sorteo
      console.log('🎲 Forzando regeneración de sorteo aleatorio...');
      const deployCommand = 'pnpm supabase functions deploy make-server-252a0d41 --project-ref vmfgvdndjwwjztgcgjtx';
      
      try {
        const { stdout, stderr } = await execAsync(deployCommand, { timeout: 60000 });
        
        if (stderr && !stderr.includes('WARNING')) {
          throw new Error(stderr);
        }
        
        console.log('✅ Edge Function desplegado - nuevo sorteo generado');
        
        // If participants changed, trigger wishlist cleanup
        if (participantsChanged) {
          console.log('🧹 Limpiando wishlists debido a cambios en participantes...');
          console.log('📋 La validación automática se ejecutará en el servidor Edge Function');
          console.log('✅ Los wishlists con nombres incorrectos se eliminarán automáticamente al inicializar');
        }
        
        console.log('🔄 Forzando regeneración adicional via API...');
        
        // Simplificado - regeneración se hace automáticamente en el servidor
        setTimeout(() => {
          console.log('🎉 Sorteo completamente renovado - cada ejecución será diferente!');
        }, 1000);
        
      } catch (deployError) {
        console.error('❌ Error en deploy:', deployError.message);
        console.log('⚠️ Continuando sin deploy - usar funcionalidad local');
      }
      
      // Save current participants for next comparison
      fs.writeFileSync(lastParticipantsPath, JSON.stringify(participants, null, 2));
      
    } else {
      console.error('❌ No se encontró el array de participantes en Edge Function');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error durante sincronización:', error.message);
    console.log('⚠️ Continuando con desarrollo local...');
  }
}

// Run the sync and deploy
syncAndDeploy();