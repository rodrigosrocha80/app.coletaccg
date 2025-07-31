import os
def criar_estrutura(arquivo_estrutura):
         with open(arquivo_estrutura, 'r') as f:
             for linha in f:
                 caminho = linha.strip()
                 if caminho.endswith('/'):
                     os.makedirs(caminho, exist_ok=True)
                 else:
                     pasta = os.path.dirname(caminho)
                     os.makedirs(pasta, exist_ok=True)
                     with open(caminho, 'w') as f_arquivo:
                         pass  # Cria o arquivo vazio

# Substitua 'structure.txt' pelo nome do seu arquivo
criar_estrutura('structure.txt')