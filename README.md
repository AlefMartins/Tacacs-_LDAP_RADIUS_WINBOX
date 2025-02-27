Projeto visa a integração do Tacacs+ ao LDAP, um sistema aonde será possivel acesso via SSH pelo Web Terminal e acesso a equipamentos Mikrotik pelo Winbox fazendo chamadas direto para o dispositivos cadastrados e com monitoramento e auditoria de acessos.

O que componhe esse projeto?

Todos os serviços:

1. - Monitoramento

    1.1 - Dashboard (visão geral do sistema)

      1.1.1 - Monitoramento de recursos (CPU, memória, disco) do servidor 
      1.1.2 - Visualização de total de usuários cadastrados no banco de dados, total de usuário logados no sitema, metricas de acesso ao sistema por periodo, hoje, na semana, més.
         
    1.2 - Tela de Dispositivos
      
      1.2.1 - Gerenciamento de dispositivos no sistema (Nome, IP, Porta, Fabricante, Imagem para Identificação)
      1.2.2 - Cadastro de dispositovos
      1.2.3 - Visão do dispositivo cadastrado como (Laténcia, Status)
      1.2.4 - Metodos de conexão para o dispositivo SSH(webTerminal usando tacacs+), Telnet(webTerminal usando tacacs+), Winbox(Fabricante Mikrotik)

      
    1.3 - Tela de Auditoria por periodos com base em filtros

      1.3.1 - Relatórios de acessos/tentativas ao sistema
      1.3.2 - Relatorio de acesso de cada dispositivo
      1.3.3 - Relatório de Comando executados nos dispositos acessados via SSH
      1.3.4 - Exportação de relatório para varios formatos (xlsx, PDF, JSON, HTML)


2. - Configurações do Sistema

   2.1 - Uplaod de Imagens
     2.1.2 - Logo e Favicon do Sistema

   2.2 - Autenticação do Sistema
     2.2.1 - Criação de Usuário Local (Login, Senha, E-mail, Nome completo, Grupo de permissão)
     2.2.2 - Criação de grupos de permissão (listagem de grupos do AD caso tenha integração LDAP)
     2.2.3 - Alteração de senha (local, LDAP)
	       

   2.3 - Integração LDAP AD 
     2.3.1 - Sincronização com AD (dados de login/senha com o banco de dados local)

  2.4 - Backup
    2.4.1 - Rotina de Backup automático (programavel) com validação de integridade
    2.4.2 - Restore de Backup
    2.4.3 - Deletar Backup
    2.4.4 - Listar todos os backups

  2.5 - Sistema de email:
    2.5.1 - Configuração SMTP
    2.5.2 - Templates de email
    2.5.3 - Teste de configuração

3. Notificações
    3.1 - Local (toast)
      3.1.1 - Notificações por nivel de usuário/grupo
      3.1.2 - Notificações de login desconectado por inatividade
      3.1.3 - Notificações dispositivo desconectado por inatividade
      3.1.4 - Notificações de dispositivo offline/online
      3.1.5 - Notificações por usuário/grupo

    3.2 - E-mail 
      3.2.1 - Notificação de alteração de senha
      3.2.2 - Notificação de tentativas de login
      3.2.3 - Notificação de usuário bloqueado temporariamento por muitas tentativas no login
      3.2.4 - Notificação de backup finalizado


