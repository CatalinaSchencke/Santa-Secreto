import { randomInt } from 'node:crypto';

function validateParticipants(participants) {
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('Se necesitan al menos dos participantes.');
  }

  const ids = new Set();
  const names = new Set();
  for (const participant of participants) {
    if (
      !participant ||
      typeof participant.id !== 'string' ||
      !participant.id.trim() ||
      participant.id !== participant.id.trim() ||
      typeof participant.name !== 'string' ||
      !participant.name.trim() ||
      participant.name !== participant.name.trim()
    ) {
      throw new Error('Cada participante debe tener un ID y un nombre válidos, sin espacios al principio o al final.');
    }

    const name = participant.name.normalize('NFC').toLocaleLowerCase('es');
    if (ids.has(participant.id) || names.has(name)) {
      throw new Error('Los IDs y nombres de participantes deben ser únicos.');
    }
    ids.add(participant.id);
    names.add(name);
  }
}

function generateAssignments(participants, randomIndex = randomInt) {
  validateParticipants(participants);
  let receivers;
  do {
    receivers = [...participants];
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
  } while (receivers.some((receiver, i) => receiver.id === participants[i].id));

  return participants.map((participant, i) => ({
    personId: participant.id,
    secretFriendId: receivers[i].id
  }));
}

export { validateParticipants, generateAssignments };
