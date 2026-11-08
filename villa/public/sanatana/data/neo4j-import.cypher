// Load with: neo4j-admin database import full --nodes=nodes.csv --relationships=edges.csv sanatana
// or, from Neo4j Browser after placing the CSVs in the import directory:
LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS r
CALL apoc.create.node([r['type:LABEL']], {id: r['id:ID'], name: r.name, iast: r.iast, devanagari: r.devanagari, summary: r.summary, confidence: r.confidence, status: r.status}) YIELD node RETURN count(node);
CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id);
LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS r
MATCH (a {id: r[':START_ID']}), (b {id: r[':END_ID']})
CALL apoc.create.relationship(a, r[':TYPE'], {id: r.id, evidence_class: toInteger(r['evidence_class:int']), confidence: r.confidence, status: r.status, tradition: r.tradition, according_to_text: r.according_to_text, sources: r.sources}, b) YIELD rel RETURN count(rel);
