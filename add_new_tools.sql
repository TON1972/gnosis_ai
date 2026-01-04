-- Adicionar ferramenta Patrística
INSERT INTO tools (id, name, description, category, requiredPlan, creditCost, active) 
VALUES ('patristica', 'Patrística', 'Explora o pensamento dos Pais da Igreja sobre determinado tema ou texto, considerando o contexto e conectando-o à tradições posteriores', 'advanced', 'lumen', 75, 1);

-- Adicionar ferramenta Linha do Tempo Teológica
INSERT INTO tools (id, name, description, category, requiredPlan, creditCost, active) 
VALUES ('linha_tempo_teologica', 'Linha do Tempo Teológica', 'Gera uma linha do tempo teológica interativa e cronológica sobre qualquer tema ou doutrina', 'advanced', 'lumen', 75, 1);
