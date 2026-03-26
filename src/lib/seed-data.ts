'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { ROOMS, DOCTORS } from './mock-data';

export async function seedInitialData() {
  try {
    const { firestore } = initializeFirebase();
    
    // Check if rooms already exist
    const roomsRef = collection(firestore, 'rooms');
    const roomsSnap = await getDocs(query(roomsRef, limit(1)));
    
    if (roomsSnap.empty) {
      console.log('Seeding rooms...');
      for (const room of ROOMS) {
        await setDoc(doc(firestore, 'rooms', room.id), room);
      }
    }

    // Check if doctors already exist
    const doctorsRef = collection(firestore, 'doctors');
    const doctorsSnap = await getDocs(query(doctorsRef, limit(1)));
    
    if (doctorsSnap.empty) {
      console.log('Seeding doctors...');
      for (const doctor of DOCTORS) {
        await setDoc(doc(firestore, 'doctors', doctor.id), doctor);
      }
    }

    console.log('Seeding complete!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
}
