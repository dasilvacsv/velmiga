// actions.ts
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { 
  brands, 
  applianceTypes as appliance_types,
  cities, 
  zones, 
  clientAppliances, 
  clients, 
  applianceTypes
} from '@/db/schema';
import { eq, count, sql } from 'drizzle-orm';

// Types
type ApiResponse = {
  success: boolean;
  error?: string;
};

export async function checkData() {
  const allBrands = await db.select().from(brands);
  console.log('Marcas en DB:', allBrands);
  
  const allZones = await db.select().from(zones);
  console.log('Zonas en DB:', allZones);
  
  const allCities = await db.select().from(cities);
  console.log('Ciudades en DB:', allCities);
  
  const allTypes = await db.select().from(applianceTypes);
  console.log('Tipos en DB:', allTypes);
}

// Brands
export async function getBrands() {
  try {
    const brandsWithUsage = await db.select({
      id: brands.id,
      name: brands.name,
      createdAt: brands.createdAt,
      applianceCount: count(clientAppliances.id).as('applianceCount'),
    })
    .from(brands)
    .leftJoin(clientAppliances, eq(brands.id, clientAppliances.brandId))
    .groupBy(brands.id)
    .orderBy(brands.name);

    return brandsWithUsage.map(brand => ({
      ...brand,
      inUse: brand.applianceCount > 0
    }));
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw new Error('Failed to fetch brands');
  }
}

export async function deleteBrand(id: string): Promise<ApiResponse> {
  try {
    const appliancesUsingBrand = await db.select({
      count: count(clientAppliances.id).as('count'),
    })
    .from(clientAppliances)
    .where(eq(clientAppliances.brandId, id));

    if (appliancesUsingBrand[0].count > 0) {
      return {
        success: false,
        error: 'Esta marca está siendo usada por equipos y no puede eliminarse'
      };
    }

    await db.delete(brands).where(eq(brands.id, id));
    revalidatePath('/delete-module');
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando marca:', error);
    return {
      success: false,
      error: 'Error al eliminar la marca'
    };
  }
}

// Appliance Types
export async function getApplianceTypes() {
  try {
    const typesWithUsage = await db.select({
      id: appliance_types.id,
      name: appliance_types.name,
      createdAt: appliance_types.createdAt,
      applianceCount: count(clientAppliances.id).as('applianceCount'),
    })
    .from(appliance_types)
    .leftJoin(clientAppliances, eq(appliance_types.id, clientAppliances.applianceTypeId))
    .groupBy(appliance_types.id)
    .orderBy(appliance_types.name);

    return typesWithUsage.map(type => ({
      ...type,
      inUse: type.applianceCount > 0
    }));
  } catch (error) {
    console.error('Error obteniendo tipos de equipos:', error);
    throw new Error('Error al cargar tipos de equipos');
  }
}

export async function deleteApplianceType(id: string): Promise<ApiResponse> {
  try {
    const appliancesUsingType = await db.select({
      count: count(clientAppliances.id).as('count'),
    })
    .from(clientAppliances)
    .where(eq(clientAppliances.applianceTypeId, id));

    if (appliancesUsingType[0].count > 0) {
      return {
        success: false,
        error: 'Este tipo está siendo usado por equipos y no puede eliminarse'
      };
    }

    await db.delete(appliance_types).where(eq(appliance_types.id, id));
    revalidatePath('/delete-module');
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando tipo de equipo:', error);
    return {
      success: false,
      error: 'Error al eliminar el tipo de equipo'
    };
  }
}

// Cities
export async function getCities() {
  try {
    const citiesWithZones = await db.select({
      id: cities.id,
      name: cities.name,
      zoneId: cities.zoneId,
      zoneName: zones.name,
      createdAt: cities.createdAt,
      clientCount: count(clients.id).as('clientCount'),
    })
    .from(cities)
    .leftJoin(zones, eq(cities.zoneId, zones.id))
    .leftJoin(clients, eq(cities.id, clients.cityId))
    .groupBy(cities.id, zones.name, zones.id)
    .orderBy(cities.name);

    return citiesWithZones.map(city => ({
      ...city,
      inUse: city.clientCount > 0
    }));
  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    throw new Error('Error al cargar ciudades');
  }
}

export async function deleteCity(id: string): Promise<ApiResponse> {
  try {
    const clientsInCity = await db.select({
      count: count(clients.id).as('count'),
    })
    .from(clients)
    .where(eq(clients.cityId, id));

    if (clientsInCity[0].count > 0) {
      return {
        success: false,
        error: 'Esta ciudad tiene clientes asociados y no puede eliminarse'
      };
    }

    await db.delete(cities).where(eq(cities.id, id));
    revalidatePath('/delete-module');
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando ciudad:', error);
    return {
      success: false,
      error: 'Error al eliminar la ciudad'
    };
  }
}

// Zones
export async function getZones() {
  try {
    const zonesWithUsage = await db.select({
      id: zones.id,
      name: zones.name,
      createdAt: zones.createdAt,
      cityCount: count(cities.id).as('cityCount'),
      clientCount: sql<number>`COUNT(DISTINCT ${clients.id})`.as('clientCount'),
    })
    .from(zones)
    .leftJoin(cities, eq(zones.id, cities.zoneId))
    .leftJoin(clients, eq(zones.id, clients.zoneId))
    .groupBy(zones.id)
    .orderBy(zones.name);

    return zonesWithUsage.map(zone => ({
      ...zone,
      inUse: zone.clientCount > 0
    }));
  } catch (error) {
    console.error('Error obteniendo zonas:', error);
    throw new Error('Error al cargar zonas');
  }
}

export async function deleteZone(id: string): Promise<ApiResponse> {
  try {
    const citiesInZone = await db.select({
      count: count(cities.id).as('count'),
    })
    .from(cities)
    .where(eq(cities.zoneId, id));

    if (citiesInZone[0].count > 0) {
      return {
        success: false,
        error: 'Elimina primero todas las ciudades de esta zona'
      };
    }

    const clientsInZone = await db.select({
      count: count(clients.id).as('count'),
    })
    .from(clients)
    .where(eq(clients.zoneId, id));

    if (clientsInZone[0].count > 0) {
      return {
        success: false,
        error: 'Esta zona tiene clientes asociados y no puede eliminarse'
      };
    }

    await db.delete(zones).where(eq(zones.id, id));
    revalidatePath('/delete-module');
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando zona:', error);
    return {
      success: false,
      error: 'Error al eliminar la zona'
    };
  }
}