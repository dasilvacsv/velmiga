import React from 'react';
import { notFound } from 'next/navigation';
import { getCaseById, getClientsForCases, getUsersForTeam } from '@/features/casos/actions';
import { CaseDetailView } from '@/features/casos/components/CaseDetailView';

interface CasePageProps {
  params: {
    id: string;
  };
}

export default async function CasePage({ params }: CasePageProps) {
  try {
    const [caseData, clients, users] = await Promise.all([
      getCaseById(params.id),
      getClientsForCases(),
      getUsersForTeam()
    ]);

    if (!caseData) {
      notFound();
    }

    return (
      <CaseDetailView 
        case_={caseData}
        clients={clients}
        users={users}
      />
    );
  } catch (error) {
    console.error('Error loading case:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: CasePageProps) {
  try {
    const caseData = await getCaseById(params.id);
    
    if (!caseData) {
      return {
        title: 'Caso no encontrado',
      };
    }

    return {
      title: `${caseData.caseName} - Vilmega Legal`,
      description: caseData.description || `Detalles del caso ${caseData.caseName}`,
    };
  } catch (error) {
    return {
      title: 'Error - Vilmega Legal',
    };
  }
}