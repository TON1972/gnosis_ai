/**
 * Migração Basic legado desligada na jornada do aluno.
 * Assinaturas pagas existentes não são canceladas.
 */
export async function getBasicMigrationStatus(_userId: number) {
  return { eligible: false as const };
}
