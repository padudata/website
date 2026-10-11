// Fictional vendor exports from three ERPs, with problems planted on purpose.
// Company names, tax IDs and bank accounts are made up. Column names imitate
// typical exports but are not taken from any real system.

export const DEMO_FILES: { name: string; source: string; csv: string }[] = [
  {
    name: "d365-vendors.csv",
    source: "D365 F&O",
    csv: `Vendor account,Vendor name,Tax registration number,NITKU,Primary address,Bank account
V-00101,PT Sinar Logam Abadi,0012345678901000,0012345678901000000000,"Jl. Industri Raya 12, Bekasi",4410000001
V-00102,CV Maju Bersama Teknik,0023456789012000,,"Jl. Gatot Subroto 45, Bandung",7771234501
V-00103,PT Karya Prima Logistik,0034567890123000,0034567890124000000001,"Kawasan Pergudangan Blok C3, Cikarang",5550001112
V-00104,PT Delta Pangan Nusantara,0045678901234000,,"Jl. Raya Bogor Km 30, Depok",6660012345
V-00105,PT Gemilang Elektrik,0067890123456000,0067890123456000000000,"Jl. Mangga Dua 8, Jakarta",1112223334
V-00106,UD Sumber Rejeki,0089012345678000,,"Pasar Induk Blok A, Surabaya",9990001234
V-00107,PT Cahaya Mandiri Sentosa,0090123456789000,,"Jl. Pemuda 77, Semarang",1230045678
V-00108,PT Putra Abadi Jaya,0091234567890000,,"Jl. Ahmad Yani 3, Medan",123-004-5678
V-00109,Budi Santoso,3273011505800003,,"Jl. Cempaka 9, Bandung",3334445556
`,
  },
  {
    name: "ax2012-vendors.csv",
    source: "AX 2012",
    csv: `AccountNum,Name,VATNum,Address,BankAccount
70001,"Sinar Logam Abadi, PT",01.234.567.8-901.000,"Jl. Industri Raya No. 12 Bekasi",4410000001
70002,CV Maju Bersama Teknik,02.345.678.9-012.000,"Jl. Gatot Subroto 45 Bandung",7771234501
70003,Maju Bersama Teknik,0023456789012000,"Jl. Gatot Subroto 45 Bandung",7771234501
70004,PT Delta Pangan Nusantara,0045678901243000,"Jl. Raya Bogor Km 30 Depok",6660012345
70005,"Gemilang Elektrik, PT",0067890123456000,"Jl. Mangga Dua 8 Jakarta",1112223334
70006,PT Andalan Niaga,0000000000000000,"Jl. Veteran 21, Malang",8880001111
70007,PT Mega Konstruksi,01.234.567.8-90,"Jl. Diponegoro 5, Yogyakarta",2221110009
`,
  },
  {
    name: "odoo-partners.csv",
    source: "Odoo",
    csv: `Display Name,Tax ID,Street,Bank Accounts/Account Number
PT. Sinar Logam Abdi,0012345678901000,Jl. Industri Raya 12,2208000002
Maju Bersama Teknik,,Jl. Gatot Subroto 45,7771234501
PT Karya Prima Logistic,,Kawasan Pergudangan Blok C3,5550001112
PT Fajar Kimia,NPWP 0056789012345000,Jl. Rungkut Industri 2,4440003332
PT Hijau Daun Agro,0078901234567000,Jl. Raya Lembang 101,7778889990
Budi Santoso,3273011505800003,Jl. Cempaka 9,3334445556
`,
  },
];
