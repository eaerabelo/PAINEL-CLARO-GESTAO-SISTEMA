/* Exemplo do que faremos no código do seu componente futuramente:

const handleDeletarUsuario = async (nomeUsuario) => {
  // 1. Apaga das credenciais
  const novosUsuarios = usuarios.filter(u => u.nome !== nomeUsuario);
  
  // 2. Apaga da aba de Colaboradores e da Aba de Metas 
  const novosColaboradores = colaboradores.filter(c => c.nome !== nomeUsuario);
  
  await updateDoc(docRef, {
      usuarios: novosUsuarios,
      colaboradores: novosColaboradores
  });
};
*/
