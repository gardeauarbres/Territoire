
import { BioScanResult } from '../types';

const OPENOBS_API_URL = "https://openobs.mnhn.fr/api/occurrences/search";

export interface SpeciesOccurrence {
    scientificName: string;
    vernacularName?: string;
    group?: string;
}

/**
 * Service de liaison avec les données de l'INPN (Muséum National d'Histoire Naturelle)
 * Récupère les espèces observées récemment dans un rayon donné.
 */
export async function getLocalSpeciesFromINPN(lat: number, lng: number, radiusKm: number = 2): Promise<SpeciesOccurrence[]> {
    try {
        const delta = radiusKm * 0.01;
        const minLat = lat - delta;
        const maxLat = lat + delta;
        const minLng = lng - delta;
        const maxLng = lng + delta;

        const wkt = `POLYGON((${minLng} ${minLat}, ${minLng} ${maxLat}, ${maxLng} ${maxLat}, ${maxLng} ${minLat}, ${minLng} ${minLat}))`;

        const params = new URLSearchParams({
            wkt: wkt,
            size: "15",
            isRecent: "true"
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${OPENOBS_API_URL}?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn("[NEXUS-INPN] API inaccessible. Activation du Bio-Relais local.");
            return getFallbackSpecies();
        }

        const data = await response.json();
        const rawHits = data.data || data.hits || [];

        if (rawHits.length === 0) return getFallbackSpecies();

        const speciesList: SpeciesOccurrence[] = rawHits.map((hit: any) => ({
            scientificName: hit.scientificName || hit.tax_nom_scientifique || "Unknown",
            vernacularName: hit.vernacularName || hit.tax_nom_vernaculaire || null,
            group: hit.group2_inpn || "Biodiversité"
        })).filter((s: any) => s.scientificName !== "Unknown");

        return Array.from(new Map(speciesList.map(item => [item.scientificName, item])).values());

    } catch (error) {
        console.warn("[NEXUS-INPN] Erreur de liaison. Activation du Bio-Relais local.");
        return getFallbackSpecies(); 
    }
}

/**
 * Fournit des espèces de secours basées sur la biodiversité commune d'Europe occidentale
 * si l'API INPN ne répond pas (CORS ou maintenance).
 */
function getFallbackSpecies(): SpeciesOccurrence[] {
    return [
        { scientificName: "Parus major", vernacularName: "Mésange charbonnière", group: "Oiseaux" },
        { scientificName: "Fagus sylvatica", vernacularName: "Hêtre commun", group: "Plantes à fleurs" },
        { scientificName: "Erinaceus europaeus", vernacularName: "Hérisson d'Europe", group: "Mammifères" },
        { scientificName: "Vanessa atalanta", vernacularName: "Vulcain", group: "Insectes" }
    ];
}
