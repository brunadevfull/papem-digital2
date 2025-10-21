-- Atualiza o usuário admin para utilizar hash no formato salt:hash compatível com hashPassword
UPDATE users
SET password = '17333f4b172198f4df0a57098856c83d:368b23c26b1ab169a3269c3eced695d1d5d396a043a1e6916111ed110bfa42f109965b1092ace50234d4460d476a7705fcd433c1134a30b9c5dd2d461fbce0d1'
WHERE username = 'admin';
