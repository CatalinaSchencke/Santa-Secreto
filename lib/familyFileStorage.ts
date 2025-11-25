import fs from 'fs';
import path from 'path';

// Directorio donde se guardarán los datos de las familias
const DATA_DIR = path.join(process.cwd(), 'data', 'families');

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface FamilyData {
  code: string;
  name: string;
  eventDate: string | null;
  maxBudget: number | null;
  participants: Participant[];
  assignments: Assignment[];
  wishlist: WishlistItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Participant {
  id: number;
  name: string;
  addedAt: string;
}

export interface Assignment {
  giver: string;
  receiver: string;
  assignedAt: string;
}

export interface WishlistItem {
  id: number;
  participantId: number;
  item: string;
  addedAt: string;
}

// Obtener ruta del archivo de familia
function getFamilyFilePath(code: string): string {
  return path.join(DATA_DIR, `${code}.json`);
}

// Crear nueva familia
export function createFamily(familyData: Omit<FamilyData, 'participants' | 'assignments' | 'wishlist'>): boolean {
  try {
    const filePath = getFamilyFilePath(familyData.code);
    
    // Verificar si ya existe
    if (fs.existsSync(filePath)) {
      return false;
    }

    const fullFamilyData: FamilyData = {
      ...familyData,
      participants: [],
      assignments: [],
      wishlist: [],
    };

    fs.writeFileSync(filePath, JSON.stringify(fullFamilyData, null, 2));
    return true;
  } catch (error) {
    console.error('Error creating family file:', error);
    return false;
  }
}

// Obtener familia por código
export function getFamily(code: string): FamilyData | null {
  try {
    const filePath = getFamilyFilePath(code);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading family file:', error);
    return null;
  }
}

// Actualizar familia
export function updateFamily(code: string, updates: Partial<FamilyData>): boolean {
  try {
    const filePath = getFamilyFilePath(code);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating family file:', error);
    return false;
  }
}

// Verificar si una familia existe
export function familyExists(code: string): boolean {
  const filePath = getFamilyFilePath(code);
  return fs.existsSync(filePath);
}

// Listar todas las familias (útil para admin)
export function getAllFamilies(): FamilyData[] {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
    const families: FamilyData[] = [];

    for (const file of files) {
      try {
        const data = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
        families.push(JSON.parse(data));
      } catch (error) {
        console.error(`Error reading family file ${file}:`, error);
      }
    }

    return families;
  } catch (error) {
    console.error('Error listing families:', error);
    return [];
  }
}

// Eliminar familia (si es necesario)
export function deleteFamily(code: string): boolean {
  try {
    const filePath = getFamilyFilePath(code);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting family file:', error);
    return false;
  }
}