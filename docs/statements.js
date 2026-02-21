db.getCollection("statements").find({ "month": "2026-01" })

//db.getCollection('statements').updateMany(
// {}, 
// { $unset: { "transactions.$[].category": "" } }
//);


db.getCollection('statements').aggregate([
  // 1. Filtra pela raiz do documento antes de processar os arrays
//  { 
//    $match: { 
//      month: "2025-09" // Substitua pelo mês desejado
//    } 
//  },

  // 1. "Explode" o array de transações para documentos individuais
  { $unwind: "$transactions" },

  // 2. Agrupa pelo campo 'place', o que remove as duplicatas (Distinct)
  { $group: { _id: "$transactions.name" } },

  // 3. Opcional: Ordena alfabeticamente para facilitar a visualização
  { $sort: { _id: 1 } },

  // 4. Formata a saída para vir apenas uma lista de strings
  { $group: { 
      _id: null, 
      transactions: { $push: "$_id" } 
    } 
  },

  // 5. Remove o _id do resultado final
  { $project: { _id: 0, transactions: 1 } }
]).toArray();