/**
 * WayfindingService — Indoor navigation and point-of-interest intelligence.
 */

const POI_DATABASE = [
  // Floor 1
  { id: 'lobby', name: 'Main Lobby', floor: 1, x: 50, y: 90, type: 'AMENITY' },
  { id: 'pharmacy', name: 'Ambulatory Pharmacy', floor: 1, x: 20, y: 30, type: 'CLINICAL' },
  { id: 'radiology', name: 'Radiology (X-Ray/MRI)', floor: 1, x: 80, y: 40, type: 'CLINICAL' },
  { id: 'canteen', name: 'Cafeteria & Lounge', floor: 1, x: 50, y: 15, type: 'AMENITY' },
  { id: 'emergency', name: 'Emergency Department', floor: 1, x: 15, y: 70, type: 'CLINICAL' },
  { id: 'elevator_1', name: 'East Elevator Bank', floor: 1, x: 75, y: 20, type: 'TRANSIT' },
  
  // Floor 2
  { id: 'lab', name: 'Clinical Laboratory', floor: 2, x: 30, y: 20, type: 'CLINICAL' },
  { id: 'cardiology', name: 'Cardiology Unit', floor: 2, x: 70, y: 50, type: 'CLINICAL' },
  { id: 'icu', name: 'Intensive Care Unit (ICU)', floor: 2, x: 20, y: 60, type: 'CLINICAL' },
  { id: 'physio', name: 'Physiotherapy', floor: 2, x: 80, y: 80, type: 'CLINICAL' },
  { id: 'elevator_2', name: 'East Elevator Bank', floor: 2, x: 75, y: 20, type: 'TRANSIT' },
];

export const getPOIs = () => POI_DATABASE;

export const getPOIsByFloor = (floor) => POI_DATABASE.filter(p => p.floor === floor);

export const searchPOI = (query) => {
  return POI_DATABASE.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
};

/**
 * Generates turn-by-turn directions between two POIs.
 * Includes floor transition intelligence.
 */
export const calculateRoute = (startId, endId) => {
  const start = POI_DATABASE.find(p => p.id === startId);
  const end = POI_DATABASE.find(p => p.id === endId);

  if (!start || !end) return null;

  const steps = [];
  const waypoints = [start];
  
  if (start.floor !== end.floor) {
    const elevator = POI_DATABASE.find(p => p.type === 'TRANSIT' && p.floor === start.floor);
    if (elevator) {
      steps.push(`Walk to the ${elevator.name}.`);
      waypoints.push(elevator);
      steps.push(`Take elevator to Level ${end.floor}.`);
      // Simulating the destination elevator point
      const destElevator = POI_DATABASE.find(p => p.type === 'TRANSIT' && p.floor === end.floor);
      if (destElevator) waypoints.push(destElevator);
    } else {
      steps.push(`Go to the nearest stairs/elevator.`);
      steps.push(`Move to Level ${end.floor}.`);
    }
  }

  // Directional logic
  if (end.x < start.x) steps.push(`Head West towards ${end.name}.`);
  else if (end.x > start.x) steps.push(`Head East towards ${end.name}.`);
  
  if (end.y < start.y) steps.push(`Turn North for 20 meters.`);
  else if (end.y > start.y) steps.push(`Turn South for 20 meters.`);

  steps.push(`Arrive at ${end.name}.`);
  waypoints.push(end);

  return {
    start,
    end,
    steps,
    path: waypoints
  };
};
