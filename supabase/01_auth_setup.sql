-- 1. Criar a coluna de codigo_acesso na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_acesso VARCHAR(5);

-- 2. Criar função para login e registro
CREATE OR REPLACE FUNCTION login_ou_registro(p_nome TEXT, p_codigo TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario RECORD;
    v_codigo_formatado VARCHAR(5);
BEGIN
    -- Formata o código (até 5 caracteres, sem espaços, maiúsculo se quiser padronizar, ou mantém original)
    -- Vamos manter original sem espaços extras
    v_codigo_formatado := trim(substr(p_codigo, 1, 5));

    IF v_codigo_formatado IS NULL OR v_codigo_formatado = '' THEN
        RETURN json_build_object('sucesso', false, 'mensagem', 'O código de acesso é obrigatório.');
    END IF;

    -- Busca o usuário pelo nome (ignorando maiúsculas/minúsculas e espaços)
    SELECT * INTO v_usuario FROM usuarios WHERE lower(trim(nome)) = lower(trim(p_nome));
    
    IF FOUND THEN
        -- Usuário existe
        IF v_usuario.codigo_acesso IS NULL THEN
            -- Primeiro login do usuário existente (transição)
            UPDATE usuarios 
            SET codigo_acesso = v_codigo_formatado 
            WHERE id = v_usuario.id
            RETURNING * INTO v_usuario;

            RETURN json_build_object('sucesso', true, 'usuario', row_to_json(v_usuario), 'mensagem', 'Código cadastrado com sucesso!');
        ELSE
            -- Valida o código
            IF upper(trim(v_usuario.codigo_acesso)) = upper(v_codigo_formatado) THEN
                RETURN json_build_object('sucesso', true, 'usuario', row_to_json(v_usuario));
            ELSE
                RETURN json_build_object('sucesso', false, 'mensagem', 'Código de acesso incorreto.');
            END IF;
        END IF;
    ELSE
        -- Usuário não existe, cria a conta com o código fornecido
        INSERT INTO usuarios (nome, codigo_acesso) 
        VALUES (trim(p_nome), v_codigo_formatado)
        RETURNING * INTO v_usuario;

        RETURN json_build_object(
            'sucesso', true, 
            'usuario', row_to_json(v_usuario),
            'mensagem', 'Conta criada com sucesso.'
        );
    END IF;
END;
$$;
