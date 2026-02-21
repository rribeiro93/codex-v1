Atue como um classificador de transações bancárias para o estado de São Paulo.
Receba uma lista de nomes de estabelecimentos e retorne um JSON ligando o nome original à sua categoria e nome amigável.

Importante: Não omita nenhum valor

Regras de Categoria:
"Alimentação",
"Assinatura",
"Bem Estar",
"Educação",
"Lazer",
"Outros",
"Pets",
"Saúde",
"Supermercado",
"Transporte",
"Vestuário"

Lista de Lugares:
ZP *STHEFANY 53487
CNXESPORTESLTDA
CNXENTRETENIMENTO
AVALON
BANANA POINT
HIROTA EXPRESS ROBOCOP
J.B.K. GESTAO DE ESTACI
SHOPEE *TINNYYOU
VIA PALMITO
SGA2 COMERCIO DE
ANAALICEALVESDA
LUCIMARARIBEIRO
ANAPAULAGUIMARAES
ESTACIONAMENTO / CAFE
SSCOMERCIODE
SHEIN *SHEINCOM
SHOPEE *LADECORE
LUMORENO III
CATUCHA AUTO POSTO
TABIRA SERVICOS DE LAVA
MP*MYTOY4U
GESTAO COMPARTILH
ZIG *FREEZE PORTAO 4

Output esperado:
db.getCollection("transaction_mappings").insertMany([{
    "transaction" : "",
    "cleanName" : "",
    "category" : "",
    "createdAt" : ISODate("2026-02-07T15:07:50.554+0000"), // defina data e hora atual
    "updatedAt" : ISODate("2026-02-07T15:07:50.554+0000") // defina data e hora atual
}])

