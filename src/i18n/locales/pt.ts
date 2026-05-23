import type { TranslationTree } from './ko';

export const pt: TranslationTree = {
  common: {
    ok: 'OK',
    success: 'Concluído',
  },
  tabs: {
    appTitle: '📖 Memorizar a Escritura',
    appSubtitle: 'Palavra no coração',
    home: 'Início',
    quiz: 'Quiz',
    verses: 'Gerenciar',
    settings: 'Configurações',
  },
  verses: {
    listTitle: 'Meus versículos',
    addButton: 'Adicionar',
    emptyTitle: 'Nenhum versículo ainda',
    emptyBody: 'Toque em «Adicionar» no canto superior direito.',
    edit: 'Editar',
    delete: 'Excluir',
    deleteTitle: 'Excluir versículo',
    deleteConfirm: 'Excluir «{{ref}}»?',
    cancel: 'Cancelar',
    errorDelete: 'Não foi possível excluir',
    headerAddA11y: 'Adicionar versículo',
    a11yEdit: 'Editar {{ref}}',
    a11yDelete: 'Excluir {{ref}}',
    deleteSuccess: 'Versículo removido.',
    historyTitle: 'Histórico de prática',
    historyColCategory: 'Tipo',
    historySession: '{{n}}.ª vez',
    historyShort: 'Curto (7)',
    historyLong: 'Longo',
    historyDateCompleted: '(concluído)',
    historyDateScheduled: '(agendado)',
    jumpToLong: 'Longo',
    jumpToLongA11y:
      'Simula curta completa para {{ref}} e muda para a trilha longa.',
    jumpToLongTitle: 'Ir para trilha longa',
    jumpToLongMessage:
      'Todos os registros de revisão deste versículo serão apagados e surgirão sete êxitos curtos fictícios. Agenda fica em trilha longa para revisar hoje (intervalo 7 dias).',
    jumpToLongConfirm: 'Continuar',
    jumpToLongSuccess: 'Enviado para trilha longa.',
  },
  verseForm: {
    titleAdd: 'Adicionar versículo',
    titleEdit: 'Editar versículo',
    reference: 'Referência',
    body: 'Texto',
    meditationOptional: 'Reflexão (opcional)',
    phReference: 'ex.: Romanos 8:28',
    phBody: 'Digite o versículo para memorizar',
    phMeditation: 'Notas ou reflexão',
    hintShortTrack:
      'Versículos novos começam na trilha curta; a revisão começa hoje.',
    save: 'Salvar',
    saveEdit: 'Salvar alterações',
    saving: 'Salvando…',
    requiredFields: 'Referência e texto são obrigatórios.',
    accessibilityRef: 'Referência bíblica',
    bodyA11y: 'Corpo do versículo',
    remaA11y: 'Reflexão',
    saveA11y: 'Salvar versículo',
    saveEditA11y: 'Salvar alterações',
    saveSuccess: 'O versículo foi salvo.',
  },
  review: {
    modeFull: 'Vista completa',
    modeVerseOnly: 'Só o versículo',
    nextLabel: 'Próx.',
    phaseShort: 'Curto',
    phaseLong: 'Longo',
    recited: 'Recitado',
    meta: 'Próx.: {{date}} · {{phase}} ({{count}}/7)',
    emptyTitle: 'Nenhuma revisão para hoje',
    emptyBody: 'Adicione um versículo ou verifique a próxima data.',
    loading: 'Revisão de hoje',
    loadingA11y: 'Carregando revisão de hoje',
    successA11y: 'Revisão concluída',
    correctA11y: 'Recitado',
  },
  celebration: {
    title: '7 repetições com sucesso!',
    subtitle:
      'Não foi possível pré-visualizar o próximo treino. Toque OK para salvar.',
    subtitleShortNextTraining:
      'Próximo treino: {{dateDisplay}}, dentro de {{days}} dias.',
    subtitleShortNextTrainingToday:
      'O próximo treino é hoje ({{dateDisplay}}).',
    later: 'Depois (manter marcações)',
    closeA11y: 'Fechar',
    congratsA11y: 'Parabéns',
    dismissA11y: 'Fazer depois',
    longTitle: 'Trilha longa — revisão de hoje',
    longSubtitle:
      'Depois dos 7 toques: o intervalo atual foi suficiente?',
    longPass: 'Sim — registrar sucesso na revisão espaçada',
    longFail: 'Não — repetir declamações (×7) e reagendar',
    longPassA11y: 'Registrar revisão espaçada com sucesso',
    longFailA11y:
      'Iniciar retrabalho por falhar a revisão espaçada',
    remedialTitle: 'Retrabalho ×7 concluído',
    remedialSubtitle:
      'Confirme para agendar la próxima revisión después del mismo intervalo a partir de hoy.',
    remedialAck: 'Aplicar próximas datas',
    remedialAckA11y:
      'Concluir retrabalho e atualizar revisão seguinte',
  },
  seven: {
    sectionLabel: '7 marcações',
    sectionLabelLongRemedial: 'Declamação de recuperação (×7)',
    captionRecite:
      'Só marque abaixo quando estiver perfeito de memória e continue declamando. São 7 recitações nesta rodada.',
    captionLongRemedial:
      'Após falhar a revisão espaçada (intervalo atual {{days}} dia(s)): marque só quando cada repetição ficar firme.',
    progress: '{{done}} / {{total}} concluído',
    rep: 'Rep. {{n}}',
    statusDone: 'feito',
    statusCheck: 'sua vez',
    statusWait: 'aguardando',
    a11yCell: '{{rep}} {{status}}',
    verifyScriptureBtn: 'Ver versículo',
    verifyScriptureA11y:
      'Abre a referência e o texto completo para conferir o que memorizar.',
  },
  rema: {
    label: 'Reflexão',
    viewAction: 'Ver reflexão',
    modalCloseA11y: 'Fechar',
  },
  quiz: {
    accuracy: 'Precisão',
    correctCount: 'Acertos',
    refPromptShort: 'Qual é a referência deste versículo?',
    stats: '{{correct}} / {{total}} acertos',
    verseBody: 'Texto do versículo',
    refPrompt: 'Referência (recite)',
    phRef: 'Digite a referência bíblica deste versículo',
    hint: 'Dica',
    correct: 'Correto!',
    wrong: 'Quase',
    answerLabel: 'Resposta',
    answerLine: '{{label}}: {{ref}}',
    emptyTitle: 'Nenhum versículo para o quiz',
    emptyBody: 'Adicione versículos na aba Versículos primeiro.',
    hintBtn: 'Dica',
    check: 'Verificar',
    next: 'Próximo',
    a11yRefInput: 'Campo da referência',
    a11yVerify: 'Verificar resposta',
    a11yNextQ: 'Próxima pergunta',
  },
  reference: {
    label: 'Referência',
  },
  errors: {
    title: 'Erro',
    notAuthenticated: 'É necessário entrar na conta.',
    emailNotConfirmed:
      'O e-mail ainda não foi verificado. Abra o link do e-mail de cadastro (e a pasta spam) e tente entrar de novo. Em desenvolvimento, desative “Confirm email” em Supabase → Authentication → Providers → Email.',
    emailRateLimitExceeded:
      'Limite do Supabase para enviar e-mails de autenticação excedido. Comum ao repetir cadastro ou reenviar e-mail. Tente mais tarde (minutos a ~1 h). Em dev, desative “Confirm email”.',
    verseNotFound: 'Versículo não encontrado.',
    scheduleNotFound: 'Cronograma de revisão não encontrado.',
    insertFailed: 'Não foi possível salvar.',
    unknown: 'Ocorreu um erro desconhecido.',
    loadFailed: 'Erro ao carregar',
    saveFailed: 'Falha ao salvar',
    reviewScheduleSchemaOutOfDate:
      'Falta a coluna `long_success_count` em `review_schedule`. No Supabase → SQL Editor, execute a migração em `supabase/migrations/20260517000000_review_schedule_long_success_count.sql` e tente de novo.',
  },
  auth: {
    bootstrapFailed: 'Não foi possível preparar o aplicativo.',
    bootstrapHint:
      'Confira EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e habilite Email em Dashboard → Authentication → Providers.',
    emailGateTitle: 'Registrar · Entrar',
    emailGateBody:
      'Cadastre-se ou entre com e-mail para salvar versículos e sincronizar entre dispositivos.',
    emailGateBodySignIn:
      'Depois de entrar, Início e Versículos mostram apenas os dados desta conta.',
    devAllowedUserHint:
      '[Build de desenvolvimento] O id local só pode ser "{{part}}" (antes do @). Apague EXPO_PUBLIC_DEV_EMAIL_LOCAL_PART_ONLY no `.env` para liberar.',
    devAllowedUser:
      '[Dev] Use "{{part}}" como id local antes do @.',
    signInWorking: 'Entrando…',
    signUpWorking: 'Enviando seu cadastro ao servidor…',
    signUpConfirmingSession: 'Concluindo cadastro e verificando a conta…',
    signInReadingSession: 'Carregando sessão…',
    signInProceedHint: 'Toque em OK para abrir.',
    afterLoginNoSession:
      'O login pareceu funcionar, mas nenhuma sessão foi salva.',
    afterSignUpNoSession:
      'O cadastro funcionou, mas não foi possível criar a sessão. Verifique e-mail e Supabase.',
    technicalDetail: 'Detalhe:',
    retry: 'Tentar de novo',
    welcomeBlurb:
      'Salve versículos e pratique memorização com revisões de curto e longo prazo. Ao se cadastrar, continue em qualquer dispositivo com uma só conta.',
    backToWelcome: 'Voltar ao início',
    signUpIntro:
      'Três campos: nome, e-mail (serve como login) e a senha que você escolher.',
    privacySignUpNotice:
      'O cadastro coleta nome, e-mail (ID de entrada) e senha. Nome e e-mail servem para identificação, recuperação e comunicações (incl. verificação de e-mail). Versículos e revisões sincronizam com sua conta. Só pedimos o mínimo; veja a Política de Privacidade do provedor sobre retenção e terceiros.',
    privacyConsentCheck:
      'Li o aviso e concordo com a coleta e o uso das informações pessoais.',
    privacyConsentRequired:
      'Para se cadastrar, confira o aviso e marque o consentimento.',
    signUpNeedConsentHint:
      'Marque primeiro a caixa de consentimento abaixo e tente de novo.',
  },
  home: {
    title: 'Inscribe',
    annualTitle: 'Meta anual de memorização',
    annualUnit: 'versículos',
    annualCaption: '~{{weeks}} vers./sem. ({{goal}}/ano)',
    reviewSection: 'Revisão de hoje',
    reviewHint: 'Mostra versículos com revisão hoje ou antes.',
    yearlyGoalCaption: 'Meta do ano',
    goalPct: '{{pct}} %',
    goalVersesSuffix: '',
    sectionShort: 'Grupo curto',
    sectionLong: 'Grupo longo',
    todayTrainingVersesBadge: 'Versículos para treinar hoje',
    reviewListColKind: 'Trilha',
    reviewListColVerse: 'Versículo',
    reviewListColSession: 'Sessão',
    reviewListColLastPractice: 'Última prática',
    reviewListColStatus: 'Situação',
    reviewListFirstPractice: 'Primeira prática',
    reviewListRowA11y:
      '{{phase}}. {{ref}}. {{session}}. {{lastPractice}}. {{status}}.',
    reviewListSessionPractice: 'Sessão {{n}} prática',
    reviewListTrainingDoneStatus: 'Concluído',
    reviewListTrainingPendingStatus: 'Pendente',
    sectionLongRetrain: 'Trilha longa — retrabalhar ×7 e reagendar',
    badgeShortDay: 'Dia {{n}}',
    badgeLongInterval: '{{days}} dia(s)',
    badgeLongRetrain: 'Reprogramar cada {{days}} dia(s)',
    emptyVersesHint:
      'Ainda não há versículos salvos — nada para praticar. Na aba «{{tab}}» embaixo, adicione passagens para memorizar.',
    emptyVersesCta: 'Abrir {{tab}}',
    loadError: 'Não foi possível carregar',
    loadErrorHint:
      '(Verifique login, migrações do Supabase e RLS.)',
  },
  memorize: {
    badgeRecite: 'Memorizar — só referência (recitar o texto)',
    badgeReciteSession: 'Memorizar — só referência (recitar o texto)',
    trainingCardTitle: 'Cartão {{n}}',
    trainingCardTitleA11y: 'Cartão de treino {{n}}',
    noMoreVersesToday: 'Não há mais versículos para treinar hoje.',
    allSessionsDoneForToday:
      'Você concluiu todas as sessões de hoje na lista. Volte amanhã.',
  },
  summary: {
    donePrefix: 'Feito hoje ',
    doneSuffix: ' revisões',
    duePrefix: 'Para hoje ',
    dueSuffix: ' itens',
  },
  settings: {
    title: 'Configurações',
    annualGoal: 'Meta anual',
    annualGoalHint: 'Versículos a adicionar este ano (padrão 52)',
    apply: 'Aplicar',
    reviewCycle: 'Ciclo de revisão',
    rcShort:
      'Curto: 7 repetições por dia por 7 dias, depois passa ao longo.',
    rcLong:
      'Longo: primeira revisão espaçada ~7 dias após o curto; após o n‑ésimo sucesso espaçado, o próximo fica para 7 × 2^(n-1) dias (1º: +7d; 2º: +14d; depois 28…). Falha ⇒ ciclo ×7 e o mesmo espaçamento; três falhas contadas ⇒ metade do intervalo (mín 7 dias).',
    resetPracticeSection: 'Resetar estudo',
    resetPracticeHint:
      'Remove registros de prática e repõe as agendas nos versículos ativos; texto e referência permanecem.',
    resetPracticeBtn: 'Zerar prática',
    resetPracticeA11y:
      'Reinicia trilhas curta e longa de todos os versículos ativos.',
    resetPracticeTitle: 'Zerar prática',
    resetPracticeMessage:
      'Todos os versículos ativos voltam ao dia 1 da trilha curta (para hoje) e os registros são apagados. O texto permanece. Para testes.',
    resetPracticeConfirm: 'Reiniciar',
    resetPracticeDone: 'Prática reiniciada.',
    resetPracticeNothingTitle: 'Nada para reiniciar',
    resetPracticeNothingBody:
      'Não há versículos ativos salvos. Adicione na aba Versículos e tente novamente.',
    language: 'Idioma',
    langKo: '한국어',
    langEn: 'English',
    langEs: 'Español',
    langPt: 'Português',
    langZh: '中文',
    notifications: 'Notificações',
    notifyEnable: 'Lembrete diário',
    notifyTime: 'Horário do lembrete',
    notifyTimeWebHint:
      'Na web, use formato 24 h HH:mm (ex.: 09:05). Toque em OK para salvar.',
    sync: 'Dados e sincronização',
    syncBody:
      'Versículos e registros sincronizam entre dispositivos via Supabase.',
    syncOk: 'Sincronização na nuvem ativa',
    syncNeedAuth: 'Entre na conta para sincronizar.',
    signedInAs: 'Conta',
    syncAnonCaption:
      'Sessão anônima. Crie uma conta com e-mail para manter os mesmos versículos em todos os aparelhos.',
  },
  account: {
    section: 'Conta',
    nameLabel: 'Nome',
    phName: 'ex.: Ana Silva',
    fullNameA11y: 'Nome',
    email: 'E-mail',
    password: 'Senha',
    phEmail: 'voce@email.com',
    emailIdHint: 'O e-mail é o usuário ao entrar.',
    phPassword: '6+ caracteres',
    signIn: 'Entrar',
    signUp: 'Registrar',
    signOut: 'Sair',
    working: 'Processando…',
    signUpSuccessTitle: 'Cadastro concluído',
    signUpSuccessLoggedIn:
      'Sua conta foi criada e você já está logado.',
    signUpSuccessVerifyEmail:
      'Sua conta foi criada. Abra o link no e-mail e depois entre por aqui.',
    signedInWithEmail: 'Logado com e-mail',
    anonSession: 'Modo anônimo',
    hintAfterSignOut:
      'Após sair, entre de novo para continuar usando o app.',
    weakPassword: 'A senha deve ter pelo menos 6 caracteres.',
    fillBoth: 'Informe e-mail e senha.',
    fillSignUp: 'Informe nome, e-mail e senha.',
    badEmail: 'Verifique o formato do e-mail.',
    signedInOk: 'Entrada feita.',
    signedOutOk: 'Saiu da conta.',
    headerSignedInAsA11y: 'Conta: {{name}}',
  },
  notifications: {
    dailyTitle: 'Revisão de hoje',
    dailyBody: 'Hora de praticar seus versículos.',
    dueCountBody:
      'Você tem {{count}} versículo(s) para revisar hoje 📖',
  },
};
